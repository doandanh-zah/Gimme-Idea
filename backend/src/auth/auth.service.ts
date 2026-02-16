import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { SolanaService } from "../shared/solana.service";
import { SupabaseService } from "../shared/supabase.service";
import { LoginDto } from "./dto/login.dto";
import { EmailLoginDto } from "./dto/email-login.dto";
import { LinkWalletDto } from "./dto/link-wallet.dto";
import { UpdateWalletEmailDto } from "./dto/update-wallet-email.dto";
import { ApiResponse, User } from "../shared/types";

@Injectable()
export class AuthService {
  constructor(
    private solanaService: SolanaService,
    private supabaseService: SupabaseService,
    private configService: ConfigService
  ) {}

  /**
   * Login with Solana wallet signature (SIWS - Sign In With Solana)
   */
  async login(
    loginDto: LoginDto
  ): Promise<ApiResponse<{ token: string; user: User }>> {
    const { publicKey, signature, message } = loginDto;

    // 1. Verify Solana signature
    const isValid = this.solanaService.verifySignature(
      publicKey,
      signature,
      message
    );
    if (!isValid) {
      throw new UnauthorizedException("Invalid signature");
    }

    // 2. Check if user exists in database
    const supabase = this.supabaseService.getAdminClient();
    let { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet", publicKey)
      .single();

    // 3. If user doesn't exist, create new user
    if (error || !user) {
      const newUser = {
        wallet: publicKey,
        username: `user_${publicKey.slice(0, 8)}`,
        reputation_score: 0,
        login_count: 1,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const { data: createdUser, error: createError } = await supabase
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      user = createdUser;
    } else {
      // 3b. If user exists, update last login time and increment login count
      const { error: updateError } = await supabase.rpc(
        "increment_login_count",
        {
          user_id: user.id,
        }
      );

      if (updateError) {
        console.warn("Failed to update login info:", updateError.message);
        // Don't throw error, just log warning and continue
      }

      // Fetch updated user data
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (updatedUser) {
        user = updatedUser;
      }
    }

    // 4. Generate JWT token
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    const jwtExpires =
      this.configService.get<string>("JWT_EXPIRES_IN") || "365d"; // 1 year

    const token = jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet,
        username: user.username,
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    // 5. Map database user to User type
    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || "wallet",
      authId: user.auth_id,
      needsWalletConnect: user.needs_wallet_connect || false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: {
        token,
        user: userResponse,
      },
      message: "Login successful",
    };
  }

  /**
   * Login with Email (Google OAuth)
   */
  async loginWithEmail(
    emailLoginDto: EmailLoginDto
  ): Promise<ApiResponse<{ token: string; user: User; isNewUser: boolean }>> {
    const { email, authId, username } = emailLoginDto;

    const supabase = this.supabaseService.getAdminClient();

    // Use the database function to find or create user
    const { data: result, error: rpcError } = await supabase.rpc(
      "find_or_create_user_by_email",
      {
        p_email: email,
        p_auth_id: authId,
        p_username: username || null,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error(`Failed to process email login: ${rpcError.message}`);
    }

    const { user_id, is_new_user, needs_wallet } = result[0];

    // Fetch full user data
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user_id)
      .single();

    if (fetchError || !user) {
      throw new Error("Failed to fetch user data");
    }

    // Update last login
    await supabase
      .from("users")
      .update({
        last_login_at: new Date().toISOString(),
        login_count: (user.login_count || 0) + 1,
      })
      .eq("id", user_id);

    // Generate JWT token
    const jwtSecret = this.configService.get<string>("JWT_SECRET");
    const jwtExpires =
      this.configService.get<string>("JWT_EXPIRES_IN") || "365d"; // 1 year

    const token = jwt.sign(
      {
        userId: user.id,
        wallet: user.wallet,
        username: user.username,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: jwtExpires }
    );

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet || "",
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: new Date().toISOString(),
      loginCount: (user.login_count || 0) + 1,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || "google",
      authId: user.auth_id,
      needsWalletConnect: needs_wallet,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: {
        token,
        user: userResponse,
        isNewUser: is_new_user,
      },
      message: is_new_user
        ? "Account created successfully"
        : "Login successful",
    };
  }

  /**
   * Link wallet to user account
   */
  async linkWallet(
    userId: string,
    linkWalletDto: LinkWalletDto
  ): Promise<ApiResponse<{ user: User; merged: boolean }>> {
    const { walletAddress, signature, message, signedPayload, isPasskey } =
      linkWalletDto;

    // 1. Verify signature based on wallet type
    let isValid = false;

    if (isPasskey && signedPayload) {
      // Passkey wallet (LazorKit) - uses P256/WebAuthn
      isValid = this.solanaService.verifyPasskeySignature(
        signedPayload,
        signature,
        message
      );
    } else {
      // Regular Solana wallet - uses Ed25519
      isValid = this.solanaService.verifySignature(
        walletAddress,
        signature,
        message
      );
    }

    if (!isValid) {
      throw new UnauthorizedException("Invalid wallet signature");
    }

    const supabase = this.supabaseService.getAdminClient();

    // 2. Use the database function to link wallet
    const { data: result, error: rpcError } = await supabase.rpc(
      "link_wallet_to_user",
      {
        p_user_id: userId,
        p_wallet_address: walletAddress,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      throw new Error(`Failed to link wallet: ${rpcError.message}`);
    }

    const { success, message: resultMessage, merged_from_wallet } = result[0];

    if (!success) {
      throw new Error(resultMessage);
    }

    // 3. Fetch updated user data
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError || !user) {
      throw new Error("Failed to fetch updated user data");
    }

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider,
      authId: user.auth_id,
      needsWalletConnect: false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: {
        user: userResponse,
        merged: merged_from_wallet,
      },
      message: resultMessage,
    };
  }

  /**
   * Optional email enrichment for wallet-first login.
   */
  async updateWalletEmail(
    userId: string,
    dto: UpdateWalletEmailDto
  ): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();
    const email = (dto.email || '').trim().toLowerCase();

    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError || !currentUser) {
      throw new UnauthorizedException('User not found');
    }

    // Optional means user can skip for now
    if (!email) {
      const userResponse: User = {
        id: currentUser.id,
        wallet: currentUser.wallet,
        username: currentUser.username,
        bio: currentUser.bio,
        avatar: currentUser.avatar,
        coverImage: currentUser.cover_image,
        reputationScore: currentUser.reputation_score || 0,
        socialLinks: currentUser.social_links,
        lastLoginAt: currentUser.last_login_at,
        loginCount: currentUser.login_count || 0,
        createdAt: currentUser.created_at,
        email: currentUser.email,
        authProvider: currentUser.auth_provider || 'wallet',
        authId: currentUser.auth_id,
        needsWalletConnect: currentUser.needs_wallet_connect || false,
        followersCount: currentUser.followers_count || 0,
        followingCount: currentUser.following_count || 0,
      };

      return {
        success: true,
        data: userResponse,
        message: 'Skipped email update',
      };
    }

    const { data: emailTaken } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .neq('id', userId)
      .maybeSingle();

    if (emailTaken) {
      throw new BadRequestException('Email is already used by another account');
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email,
        auth_provider: currentUser.auth_provider || 'wallet',
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError || !updatedUser) {
      throw new Error(`Failed to update email: ${updateError?.message || 'Unknown error'}`);
    }

    const userResponse: User = {
      id: updatedUser.id,
      wallet: updatedUser.wallet,
      username: updatedUser.username,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      coverImage: updatedUser.cover_image,
      reputationScore: updatedUser.reputation_score || 0,
      socialLinks: updatedUser.social_links,
      lastLoginAt: updatedUser.last_login_at,
      loginCount: updatedUser.login_count || 0,
      createdAt: updatedUser.created_at,
      email: updatedUser.email,
      authProvider: updatedUser.auth_provider || 'wallet',
      authId: updatedUser.auth_id,
      needsWalletConnect: updatedUser.needs_wallet_connect || false,
      followersCount: updatedUser.followers_count || 0,
      followingCount: updatedUser.following_count || 0,
    };

    return {
      success: true,
      data: userResponse,
      message: 'Email updated successfully',
    };
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(userId: string): Promise<ApiResponse<User>> {
    const supabase = this.supabaseService.getAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException("User not found");
    }

    const userResponse: User = {
      id: user.id,
      wallet: user.wallet,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.cover_image,
      reputationScore: user.reputation_score || 0,
      socialLinks: user.social_links,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count || 0,
      createdAt: user.created_at,
      email: user.email,
      authProvider: user.auth_provider || "wallet",
      authId: user.auth_id,
      needsWalletConnect: user.needs_wallet_connect || false,
      followersCount: user.followers_count || 0,
      followingCount: user.following_count || 0,
    };

    return {
      success: true,
      data: userResponse,
    };
  }

  /**
   * Check if a wallet is already linked to an account
   */
  async checkWalletExists(
    walletAddress: string
  ): Promise<ApiResponse<{ exists: boolean; userId?: string }>> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id")
      .eq("wallet", walletAddress)
      .single();

    if (error || !user) {
      return {
        success: true,
        data: { exists: false },
      };
    }

    return {
      success: true,
      data: { exists: true, userId: user.id },
    };
  }
}
