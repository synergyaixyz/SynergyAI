/**
 * User model definition
 */

/**
 * User model class representing a platform user
 */
export class User {
  /**
   * Create a new User instance
   * @param {Object} data - User data
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.address = data.address || null;
    this.username = data.username || null;
    this.email = data.email || null;
    this.avatar = data.avatar || null;
    this.bio = data.bio || null;
    this.isVerified = data.isVerified || false;
    this.joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
    this.lastActive = data.lastActive ? new Date(data.lastActive) : new Date();
    this.preferences = data.preferences || {};
    this.reputation = data.reputation || 0;
    this.roles = data.roles || ['user'];
    this.computeResources = data.computeResources || [];
    this.synBalance = data.synBalance || 0;
    this.aipBalance = data.aipBalance || 0;
    this.stakedAmount = data.stakedAmount || 0;
  }

  /**
   * Check if the user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} Whether the user has the specified role
   */
  hasRole(role) {
    return this.roles.includes(role);
  }

  /**
   * Check if the user is an admin
   * @returns {boolean} Whether the user is an admin
   */
  isAdmin() {
    return this.hasRole('admin');
  }

  /**
   * Calculate the total value of all user tokens
   * @param {Object} prices - Current token prices
   * @returns {number} Total value in USD
   */
  calculateTotalValue(prices = { syn: 0, aip: 0 }) {
    const synValue = this.synBalance * prices.syn;
    const aipValue = this.aipBalance * prices.aip;
    const stakedValue = this.stakedAmount * prices.syn;
    return synValue + aipValue + stakedValue;
  }

  /**
   * Calculate staking percentage
   * @returns {number} Percentage of SYN tokens staked
   */
  getStakingPercentage() {
    if (this.synBalance + this.stakedAmount === 0) return 0;
    return (this.stakedAmount / (this.synBalance + this.stakedAmount)) * 100;
  }

  /**
   * Convert user data to JSON
   * @returns {Object} User data in JSON format
   */
  toJSON() {
    return {
      id: this.id,
      address: this.address,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
      bio: this.bio,
      isVerified: this.isVerified,
      joinedAt: this.joinedAt,
      lastActive: this.lastActive,
      preferences: this.preferences,
      reputation: this.reputation,
      roles: this.roles,
      computeResources: this.computeResources,
      synBalance: this.synBalance,
      aipBalance: this.aipBalance,
      stakedAmount: this.stakedAmount,
    };
  }

  /**
   * Create a User instance from JSON data
   * @param {Object} data - User data
   * @returns {User} New User instance
   */
  static fromJSON(data) {
    return new User(data);
  }
} 