pragma solidity 0.5.13;

/**
 * @title Attributes
 * @dev Library for managing addresses assigned to a Attribute.
 */
library Attributes {
    struct Attribute {
        mapping (address => bool) bearer;
    }

    /**
     * @dev Give an account access to this attribute.
     */
    function add(Attribute storage attribute, address account) internal {
        require(!has(attribute, account), "Attributes: account already has attribute");
        attribute.bearer[account] = true;
    }

    /**
     * @dev Remove an account's access to this attribute.
     */
    function remove(Attribute storage attribute, address account) internal {
        require(has(attribute, account), "Attributes: account does not have attribute");
        attribute.bearer[account] = false;
    }

    /**
     * @dev Check if an account has this attribute.
     * @return bool
     */
    function has(Attribute storage attribute, address account) internal view returns (bool) {
        require(account != address(0), "Attributes: account is the zero address");
        return attribute.bearer[account];
    }
}
