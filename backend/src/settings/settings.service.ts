import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../shared/supabase.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get public menu configuration for the Navbar
   */
  async getMenuConfig() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('system_settings')
        .select('value')
        .eq('key', 'menu_config')
        .single();

      if (error) {
        // If config doesn't exist yet, return default structure matching the current hardcoded one
        if (error.code === 'PGRST116') {
          return this.getDefaultMenuConfig();
        }
        this.logger.error(`Error fetching menu config: ${error.message}`);
        return this.getDefaultMenuConfig();
      }

      return data.value;
    } catch (err) {
      this.logger.error(`Unexpected error fetching menu config: ${err}`);
      return this.getDefaultMenuConfig();
    }
  }

  /**
   * Default configuration to use if DB is empty or fails
   */
  private getDefaultMenuConfig() {
    return [
      { 
        id: 'hackathon',
        name: 'Hackathon', 
        route: '/hackathon', 
        icon: 'Trophy', 
        status: 'open', // open, locked, hidden
        highlight: {
          borderColor: '#14F195',
          glow: true,
          badge: 'LIVE'
        }
      },
      { 
        id: 'about',
        name: 'About Us', 
        route: '/about', 
        icon: 'Info', 
        status: 'open' 
      },
      { 
        id: 'contact',
        name: 'Contact', 
        route: '/contact', 
        icon: 'Mail', 
        status: 'locked',
        highlight: {
          badge: 'SOON'
        }
      },
    ];
  }
}
