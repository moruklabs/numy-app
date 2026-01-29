#!/usr/bin/env ruby
# Idempotent script to suppress Xcode build script warnings
# Adds always_out_of_date = true to all shell script build phases

require 'fileutils'

PODFILE_PATH = File.join(__dir__, '..', 'ios', 'Podfile')
MARKER_COMMENT = '# Fix: Suppress "will be run during every build" warnings'

CODE_TO_ADD = <<~RUBY.gsub(/^/, '    ')
#{MARKER_COMMENT}
installer.pods_project.targets.each do |target|
  target.build_phases.each do |phase|
    if phase.is_a?(Xcodeproj::Project::Object::PBXShellScriptBuildPhase)
      phase.always_out_of_date = 'YES'
    end
  end
end
RUBY

def already_patched?(content)
  content.include?(MARKER_COMMENT)
end

def patch_podfile
  unless File.exist?(PODFILE_PATH)
    puts "❌ Error: Podfile not found at #{PODFILE_PATH}"
    exit 1
  end

  content = File.read(PODFILE_PATH)

  if already_patched?(content)
    puts "✅ Podfile already patched - skipping"
    return
  end

  # Find the post_install block and add our code after the react_native_post_install call
  # We need to handle the multiline react_native_post_install call

  # Pattern: Match from post_install to the end of react_native_post_install
  pattern = /(  post_install do \|installer\|\n    react_native_post_install\(.*?\n    \)\n)/m

  if content =~ pattern
    # Insert our code after the react_native_post_install call
    new_content = content.sub(pattern) do |match|
      "#{match}\n#{CODE_TO_ADD}\n"
    end

    # Create backup
    backup_path = "#{PODFILE_PATH}.backup.#{Time.now.to_i}"
    FileUtils.cp(PODFILE_PATH, backup_path)
    puts "📦 Created backup: #{backup_path}"

    # Write the modified content
    File.write(PODFILE_PATH, new_content)
    puts "✅ Successfully patched Podfile"
    puts "📝 Added code to suppress Xcode build warnings"
    puts ""
    puts "Next steps:"
    puts "  cd ios && pod install"
  else
    puts "❌ Error: Could not find post_install block in expected format"
    puts "   Please add the code manually to your Podfile"
    exit 1
  end
end

if __FILE__ == $0
  puts "🔧 Fixing Xcode build script warnings..."
  puts ""
  patch_podfile
end
