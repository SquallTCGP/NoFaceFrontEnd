use tauri_plugin_dialog;
use tauri_plugin_fs;
use tauri::Manager;  // Import the Manager trait for window handling

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .setup(|app| {
      // Get the main window and maximize it
      if let Some(window) = app.webview_windows().get("main") {
        window.maximize().unwrap();
      }

      // Enable logging only in debug mode
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
