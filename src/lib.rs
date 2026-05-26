use zed_extension_api::{self as zed, LanguageServerId, Result, Worktree};

struct CopyJsonPathExtension;

fn server_script_path() -> String {
    format!("{}/server/index.js", env!("CARGO_MANIFEST_DIR"))
}

impl zed::Extension for CopyJsonPathExtension {
    fn new() -> Self {
        Self
    }

    fn language_server_command(
        &mut self,
        language_server_id: &LanguageServerId,
        _worktree: &Worktree,
    ) -> Result<zed::Command> {
        if language_server_id.as_ref() != "copy-json-path" {
            return Err(format!("unknown language server: {language_server_id}"));
        }

        Ok(zed::Command {
            command: zed::node_binary_path()?,
            args: vec![server_script_path(), "--stdio".to_string()],
            env: vec![],
        })
    }
}

zed::register_extension!(CopyJsonPathExtension);

#[cfg(test)]
mod tests {
    use super::server_script_path;

    #[test]
    fn server_script_path_is_absolute_and_points_to_bundled_server() {
        let path = server_script_path();

        assert!(path.starts_with('/'), "{path} should be absolute");
        assert!(
            path.ends_with("/server/index.js"),
            "{path} should point to server/index.js"
        );
        assert!(
            std::path::Path::new(&path).exists(),
            "{path} should exist in the extension folder"
        );
    }
}
