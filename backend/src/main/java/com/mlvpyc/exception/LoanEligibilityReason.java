package com.mlvpyc.exception;

/**
 * Every reason a loan application can be blocked or queued.
 * Each maps to a specific, human-readable fallback message shown in the UI.
 */
public enum LoanEligibilityReason {

    ALREADY_HAS_ACTIVE_LOAN(
        "You've already taken a loan this term. You can't apply again until it's fully repaid."),

    COOLDOWN_LAST_TERM(
        "You borrowed last term, so you have the lowest priority this term. " +
        "You'll only be offered a slot if no other eligible member needs one."),

    EXCEEDS_TERM_LIMIT(
        "The maximum loan amount per term is ₹2,00,000. Please request a lower amount."),

    EXCEEDS_AVAILABLE_POOL(
        "The requested amount exceeds the pool currently available this term. " +
        "Please reduce the amount or wait for more contributions."),

    MEMBER_INACTIVE(
        "Your membership status is inactive. Please contact the admin."),

    NEW_MEMBER_LOW_PRIORITY(
        "As a newer member, you have lower priority for your first two terms. " +
        "You've been added to the waiting queue."),

    LOWER_PRIORITY_QUEUED(
        "Other members currently have higher priority based on how much/how often they've " +
        "borrowed before. You've been added to the priority queue and will be notified if a slot opens."),

    TERM_NOT_ACTIVE(
        "There is no active term open for loan applications right now."),

    INVALID_AMOUNT(
        "Please enter a valid loan amount greater than zero.");

    private final String message;

    LoanEligibilityReason(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
