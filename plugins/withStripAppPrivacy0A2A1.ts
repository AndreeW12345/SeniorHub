import {
  ConfigPlugin,
  createRunOncePlugin,
  withPodfile,
} from '@expo/config-plugins';
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode';

const PLUGIN_NAME = 'with-strip-app-privacy-0A2A1';
const TAG = 'seniorhub-strip-0A2A1-from-app-privacy-manifest';
const GENERATED_MARKER = `@generated begin ${TAG}`;

const FILE_TIMESTAMP_CATEGORY = 'NSPrivacyAccessedAPICategoryFileTimestamp';
const SDK_ONLY_REASON = '0A2A.1';

/**
 * Runs inside Podfile post_install, after react_native_post_install (privacy aggregation).
 * Removes SDK-only reason 0A2A.1 from the app target PrivacyInfo.xcprivacy only.
 */
const RUBY = `
  file_timestamp_category = '${FILE_TIMESTAMP_CATEGORY}'
  sdk_only_reason = '${SDK_ONLY_REASON}'

  user_project = PrivacyManifestUtils.get_user_project_from(installer)
  targets = PrivacyManifestUtils.get_application_targets(user_project)
  file_path = PrivacyManifestUtils.get_privacyinfo_file_path(user_project, targets)

  if file_path.include?('/Pods/') || file_path.include?('\\\\Pods\\\\')
    raise '[SeniorHub Privacy] Refusing to modify PrivacyInfo under Pods/'
  end

  unless File.exist?(file_path)
    raise "[SeniorHub Privacy] App PrivacyInfo.xcprivacy not found at: \#{file_path}"
  end

  privacy_info = Xcodeproj::Plist.read_from_path(file_path)
  api_types = privacy_info['NSPrivacyAccessedAPITypes']
  unless api_types.is_a?(Array)
    raise '[SeniorHub Privacy] App PrivacyInfo.xcprivacy must contain NSPrivacyAccessedAPITypes as an array.'
  end

  changed = false
  api_types.each do |entry|
    next unless entry['NSPrivacyAccessedAPIType'] == file_timestamp_category

    reasons = entry['NSPrivacyAccessedAPITypeReasons']
    next unless reasons.is_a?(Array)

    filtered = reasons.reject { |reason| reason == sdk_only_reason }
    next if filtered.length == reasons.length

    entry['NSPrivacyAccessedAPITypeReasons'] = filtered
    changed = true
  end

  if changed
    Xcodeproj::Plist.write_to_path(privacy_info, file_path)
    Pod::UI.puts "[SeniorHub Privacy] Removed \#{sdk_only_reason} from app PrivacyInfo.xcprivacy (SDK-only; unchanged in pod resource bundles)."
  end

  verify = Xcodeproj::Plist.read_from_path(file_path)
  verify_api_types = verify['NSPrivacyAccessedAPITypes']
  unless verify_api_types.is_a?(Array)
    raise '[SeniorHub Privacy] App PrivacyInfo.xcprivacy must contain NSPrivacyAccessedAPITypes as an array after strip.'
  end

  still_in_app = verify_api_types.any? do |entry|
    entry['NSPrivacyAccessedAPIType'] == file_timestamp_category &&
      entry['NSPrivacyAccessedAPITypeReasons'].to_a.include?(sdk_only_reason)
  end
  if still_in_app
    raise "[SeniorHub Privacy] \#{sdk_only_reason} remains in app PrivacyInfo.xcprivacy after strip."
  end

  expo_fs_declares_sdk_reason = false
  installer.pod_targets.each do |pod_target|
    next unless pod_target.name == 'ExpoFileSystem'
    pod_target.file_accessors.each do |file_accessor|
      file_accessor.resource_bundles.each_value do |bundle_files|
        bundle_files.each do |privacy_path|
          next unless File.basename(privacy_path) == 'PrivacyInfo.xcprivacy'
          content = Xcodeproj::Plist.read_from_path(privacy_path)
          expo_fs_declares_sdk_reason = content['NSPrivacyAccessedAPITypes'].to_a.any? do |entry|
            entry['NSPrivacyAccessedAPIType'] == file_timestamp_category &&
              entry['NSPrivacyAccessedAPITypeReasons'].to_a.include?(sdk_only_reason)
          end
        end
      end
    end
  end

  unless expo_fs_declares_sdk_reason
    raise "[SeniorHub Privacy] Expected \#{sdk_only_reason} in ExpoFileSystem pod privacy bundle source; not found."
  end
`.trimEnd();

const withStripAppPrivacy0A2A1: ConfigPlugin = (config) => {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    if (typeof contents !== 'string') {
      throw new Error(
        `[${PLUGIN_NAME}] Podfile modResults.contents is missing or not a string.`,
      );
    }

    const { contents: merged } = mergeContents({
      tag: TAG,
      src: contents,
      newSrc: RUBY,
      anchor: /:ccache_enabled => ccache_enabled\?\(podfile_properties\)/,
      offset: 2,
      comment: '#',
    });

    if (!merged.includes(GENERATED_MARKER)) {
      throw new Error(
        `[${PLUGIN_NAME}] Podfile injection failed: missing "${GENERATED_MARKER}". ` +
          'Check that the Expo SDK 57 post_install / react_native_post_install anchor still matches.',
      );
    }

    config.modResults.contents = merged;
    return config;
  });
};

export default createRunOncePlugin(withStripAppPrivacy0A2A1, PLUGIN_NAME);
