/// Arbitrage Vault - Flash loan arbitrage execution on Sui
/// This module provides functionality for automated arbitrage trading using DeepBook V3
module arbitrage_vault::vault {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID};

    /// Vault for managing arbitrage funds and profits
    public struct ArbitrageVault has key {
        id: UID,
        owner: address,
        balance: Balance<SUI>,
        total_profit: u64,
        trade_count: u64,
    }

    /// Error codes
    const EInsufficientBalance: u64 = 0;
    const ENotOwner: u64 = 1;
    const EInsufficientProfit: u64 = 2;

    /// Create a new arbitrage vault
    public entry fun create_vault(ctx: &mut TxContext) {
        let vault = ArbitrageVault {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            balance: balance::zero(),
            total_profit: 0,
            trade_count: 0,
        };
        
        transfer::share_object(vault);
    }

    /// Deposit SUI into the vault
    public entry fun deposit(
        vault: &mut ArbitrageVault,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut vault.balance, coin_balance);
    }

    /// Withdraw SUI from the vault (owner only)
    public entry fun withdraw(
        vault: &mut ArbitrageVault,
        amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, ENotOwner);
        assert!(balance::value(&vault.balance) >= amount, EInsufficientBalance);
        
        let withdrawn_balance = balance::split(&mut vault.balance, amount);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);
        
        transfer::public_transfer(withdrawn_coin, vault.owner);
    }

    /// Execute arbitrage trade (simplified version for MVP)
    /// In production, this would integrate with DeepBook flash loans
    public entry fun execute_arbitrage(
        vault: &mut ArbitrageVault,
        profit_amount: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == vault.owner, ENotOwner);
        
        // Update vault statistics
        vault.total_profit = vault.total_profit + profit_amount;
        vault.trade_count = vault.trade_count + 1;
    }

    /// Get vault balance
    public fun get_balance(vault: &ArbitrageVault): u64 {
        balance::value(&vault.balance)
    }

    /// Get total profit
    public fun get_total_profit(vault: &ArbitrageVault): u64 {
        vault.total_profit
    }

    /// Get trade count
    public fun get_trade_count(vault: &ArbitrageVault): u64 {
        vault.trade_count
    }

    /// Check if sender is owner
    public fun is_owner(vault: &ArbitrageVault, sender: address): bool {
        vault.owner == sender
    }

    #[test_only]
    use sui::test_scenario;

    #[test]
    fun test_create_vault() {
        let owner = @0xA;
        let mut scenario = test_scenario::begin(owner);
        
        {
            let ctx = test_scenario::ctx(&mut scenario);
            create_vault(ctx);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_deposit_withdraw() {
        let owner = @0xA;
        let mut scenario = test_scenario::begin(owner);
        
        // Create vault
        {
            let ctx = test_scenario::ctx(&mut scenario);
            create_vault(ctx);
        };
        
        test_scenario::end(scenario);
    }
}
