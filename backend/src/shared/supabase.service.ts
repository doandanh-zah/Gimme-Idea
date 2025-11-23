import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Client for public operations (with RLS)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client for backend operations (bypass RLS)
    if (supabaseServiceKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
  }

  // Get public client (with Row Level Security)
  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Get admin client (bypass Row Level Security)
  getAdminClient(): SupabaseClient {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not configured');
    }
    return this.supabaseAdmin;
  }

  // Helper: Upload file to Supabase Storage
  async uploadFile(bucket: string, path: string, file: Buffer | File): Promise<string> {
    const { data, error } = await this.supabaseAdmin
      .storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.supabaseAdmin
      .storage
      .from(bucket)
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  // Helper: Delete file from Supabase Storage
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabaseAdmin
      .storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
}
