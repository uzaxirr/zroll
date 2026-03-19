//! Standalone CLI tool to derive a Unified Full Viewing Key (UFVK) from a seed phrase.
//!
//! The seed phrase never leaves this process. Run it locally:
//!
//!   cargo run --bin derive-ufvk
//!
//! Then paste the UFVK into Zroll's settings. The server can view transactions
//! but cannot spend funds.

use std::num::NonZeroU32;

use bip0039::Mnemonic;
use zcash_keys::keys::{UnifiedAddressRequest, UnifiedFullViewingKey};
use zcash_protocol::consensus::Parameters;
use zingolib::config::ChainType;
use zingolib::wallet::{LightWallet, WalletBase, WalletSettings};

use pepper_sync::config::{PerformanceLevel, SyncConfig, TransparentAddressDiscovery};

fn main() {
    eprintln!("=== Zroll UFVK Derivation Tool ===");
    eprintln!();
    eprintln!("This tool derives your Unified Full Viewing Key from your seed phrase.");
    eprintln!("The seed phrase never leaves your machine.");
    eprintln!();
    eprintln!("Enter your 24-word seed phrase (space-separated):");

    let mut input = String::new();
    std::io::stdin()
        .read_line(&mut input)
        .expect("Failed to read input");

    let phrase = input.trim();
    if phrase.is_empty() {
        eprintln!("Error: No seed phrase provided.");
        std::process::exit(1);
    }

    let mnemonic: Mnemonic = phrase.parse().unwrap_or_else(|e| {
        eprintln!("Error: Invalid seed phrase: {e}");
        std::process::exit(1);
    });

    eprintln!();
    eprintln!("Network? [m]ainnet or [t]estnet (default: mainnet):");

    let mut net_input = String::new();
    std::io::stdin()
        .read_line(&mut net_input)
        .expect("Failed to read input");

    let chain_type = match net_input.trim().to_lowercase().as_str() {
        "t" | "testnet" => ChainType::Testnet,
        _ => ChainType::Mainnet,
    };

    eprintln!();
    eprintln!("Deriving keys...");

    let sapling_activation = chain_type
        .activation_height(zcash_protocol::consensus::NetworkUpgrade::Sapling)
        .expect("sapling activation height");

    let wallet_settings = WalletSettings {
        sync_config: SyncConfig {
            transparent_address_discovery: TransparentAddressDiscovery::minimal(),
            performance_level: PerformanceLevel::High,
        },
        min_confirmations: NonZeroU32::new(1).unwrap(),
    };

    let wallet = LightWallet::new(
        chain_type,
        WalletBase::Mnemonic {
            mnemonic,
            no_of_accounts: NonZeroU32::new(1).unwrap(),
        },
        sapling_activation,
        wallet_settings,
    )
    .unwrap_or_else(|e| {
        eprintln!("Error creating wallet: {e:?}");
        std::process::exit(1);
    });

    let key_store = wallet
        .unified_key_store
        .get(&zip32::AccountId::ZERO)
        .unwrap_or_else(|| {
            eprintln!("Error: No key store found for account 0");
            std::process::exit(1);
        });

    let ufvk = UnifiedFullViewingKey::try_from(key_store).unwrap_or_else(|e| {
        eprintln!("Error extracting UFVK: {e:?}");
        std::process::exit(1);
    });

    let encoded_ufvk = ufvk.encode(&chain_type);

    let address_str = match ufvk.default_address(UnifiedAddressRequest::AllAvailableKeys) {
        Ok((ua, _)) => ua.encode(&chain_type),
        Err(_) => "Could not derive address".to_string(),
    };

    eprintln!();
    eprintln!("=== Results ===");
    eprintln!();
    eprintln!("Unified Full Viewing Key (UFVK):");
    println!("{encoded_ufvk}");
    eprintln!();
    eprintln!("Default Unified Address (verify this matches your wallet):");
    eprintln!("{address_str}");
    eprintln!();
    eprintln!("Paste the UFVK into Zroll Settings > Viewing Key.");
    eprintln!("The UFVK can view all transactions but CANNOT spend funds.");
}
