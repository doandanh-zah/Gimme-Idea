package com.gimmeidea.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Keep web content below status bar/cutout area to avoid front-camera overlap.
    WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
  }
}
