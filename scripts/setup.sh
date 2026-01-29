#!/usr/bin/env bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_info "Detected macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_info "Detected Linux"
    else
        print_error "Unsupported OS: $OSTYPE"
        exit 1
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Install Homebrew (macOS) or update package manager (Linux)
install_package_manager() {
    if [[ "$OS" == "macos" ]]; then
        if ! command_exists brew; then
            print_info "Installing Homebrew..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            print_success "Homebrew installed"
        else
            print_info "Homebrew already installed"
        fi
    else
        print_info "Updating package manager..."
        sudo apt-get update
        print_success "Package manager updated"
    fi
}

# Install essential build tools
install_build_tools() {
    print_info "Installing build tools..."
    
    if [[ "$OS" == "macos" ]]; then
        # Install Xcode Command Line Tools if not present
        if ! xcode-select -p &>/dev/null; then
            xcode-select --install
            print_warning "Xcode Command Line Tools installation started. Please complete it and re-run this script."
            exit 0
        fi
        
        # Install common build dependencies
        brew install coreutils curl git
    else
        # Linux build essentials
        sudo apt-get install -y \
            build-essential \
            curl \
            git \
            libssl-dev \
            libreadline-dev \
            zlib1g-dev \
            autoconf \
            bison \
            libyaml-dev \
            libncurses5-dev \
            libffi-dev \
            libgdbm-dev \
            libjemalloc2
    fi
    
    print_success "Build tools installed"
}

# Install asdf
install_asdf() {
    # Check if asdf directory already exists
    if [[ -d "$HOME/.asdf" ]]; then
        print_info "asdf directory already exists"
        # Source asdf for current session
        . "$HOME/.asdf/asdf.sh"
        return
    fi
    
    if command_exists asdf; then
        print_info "asdf already installed"
        return
    fi
    
    print_info "Installing asdf..."
    
    git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.1
    
    # Add asdf to shell configuration
    SHELL_RC="$HOME/.zshrc"
    
    if ! grep -q "asdf.sh" "$SHELL_RC" 2>/dev/null; then
        echo "" >> "$SHELL_RC"
        echo "# asdf version manager" >> "$SHELL_RC"
        echo ". \"$HOME/.asdf/asdf.sh\"" >> "$SHELL_RC"
    fi
    
    # Source asdf for current session
    . "$HOME/.asdf/asdf.sh"
    
    print_success "asdf installed"
}

# Install asdf plugins and tools
install_asdf_tools() {
    print_info "Installing asdf plugins and tools..."
    
    # Source asdf if not already available
    if ! command_exists asdf; then
        . "$HOME/.asdf/asdf.sh"
    fi
    
    # Add plugins
    local plugins=("nodejs" "yarn" "ruby" "java")
    
    for plugin in "${plugins[@]}"; do
        if ! asdf plugin list | grep -q "^${plugin}$"; then
            print_info "Adding asdf plugin: $plugin"
            asdf plugin add "$plugin"
        fi
    done
    
    # Install tools from .tool-versions if file exists
    if [[ -f ".tool-versions" ]]; then
        print_info "Installing tools from .tool-versions..."
        asdf install
        print_success "Tools installed from .tool-versions"
    else
        print_warning ".tool-versions not found, skipping tool installation"
    fi
}

# Install Yarn dependencies
install_yarn_deps() {
    print_info "Installing project dependencies with Yarn..."
    
    # Source asdf to ensure yarn is available
    if ! command_exists yarn; then
        . "$HOME/.asdf/asdf.sh"
    fi
    
    if command_exists yarn; then
        yarn install
        print_success "Yarn dependencies installed"
    else
        print_error "Yarn not found. Please ensure asdf tools are installed correctly."
        exit 1
    fi
}

# Install global npm packages
install_global_npm_packages() {
    print_info "Installing global npm packages..."
    
    # Source asdf to ensure npm is available
    if ! command_exists npm; then
        . "$HOME/.asdf/asdf.sh"
    fi
    
    local packages=(
        "eas-cli"
        "expo-cli"
    )
    
    for package in "${packages[@]}"; do
        if ! npm list -g "$package" >/dev/null 2>&1; then
            print_info "Installing $package..."
            npm install -g "$package"
        else
            print_info "$package already installed"
        fi
    done
    
    print_success "Global npm packages installed"
}

# Install just (command runner)
install_just() {
    if command_exists just; then
        print_info "just already installed"
        return
    fi
    
    print_info "Installing just..."
    
    if [[ "$OS" == "macos" ]]; then
        brew install just
    else
        # Install just via cargo or prebuilt binary for Linux
        if command_exists cargo; then
            cargo install just
        else
            # Install prebuilt binary
            curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin
        fi
    fi
    
    print_success "just installed"
}

# Install watchman (for React Native)
install_watchman() {
    if command_exists watchman; then
        print_info "watchman already installed"
        return
    fi
    
    print_info "Installing watchman..."
    
    if [[ "$OS" == "macos" ]]; then
        brew install watchman
    else
        # Linux installation
        cd /tmp
        git clone https://github.com/facebook/watchman.git
        cd watchman
        git checkout v2024.01.22.00
        sudo apt-get install -y \
            libssl-dev \
            autoconf \
            automake \
            libtool \
            pkg-config
        ./autogen.sh
        ./configure
        make
        sudo make install
        cd ..
        rm -rf watchman
    fi
    
    print_success "watchman installed"
}

# Setup Husky git hooks
setup_husky() {
    print_info "Setting up Husky git hooks..."
    
    if [[ -d ".git" ]]; then
        yarn prepare
        print_success "Husky configured"
    else
        print_warning "Not a git repository, skipping Husky setup"
    fi
}

# Final verification
verify_installation() {
    print_info "Verifying installation..."
    
    local all_ok=true
    
    local required_commands=("asdf" "node" "yarn" "git")
    
    for cmd in "${required_commands[@]}"; do
        if command_exists "$cmd"; then
            local version
            case "$cmd" in
                asdf)
                    version=$(asdf version | head -n1)
                    ;;
                node)
                    version=$(node --version)
                    ;;
                yarn)
                    version=$(yarn --version)
                    ;;
                git)
                    version=$(git --version)
                    ;;
            esac
            print_success "$cmd: $version"
        else
            print_error "$cmd not found"
            all_ok=false
        fi
    done
    
    if [[ "$all_ok" == true ]]; then
        print_success "All required tools are installed!"
    else
        print_error "Some tools are missing. Please check the errors above."
        exit 1
    fi
}

# Main installation flow
main() {
    echo ""
    echo "========================================"
    echo "  Monorepo Development Setup Script"
    echo "========================================"
    echo ""
    
    detect_os
    
    print_info "This script will install:"
    echo "  - asdf (version manager)"
    echo "  - Node.js, Yarn, Ruby, Java (via asdf)"
    echo "  - EAS CLI, Expo CLI (global npm packages)"
    echo "  - just (command runner)"
    echo "  - watchman (file watcher for React Native)"
    echo "  - Project dependencies"
    echo ""
    
    read -p "Continue with installation? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi
    
    echo ""
    
    # Run installation steps
    install_package_manager
    install_build_tools
    install_asdf
    install_asdf_tools
    install_global_npm_packages
    install_just
    install_watchman
    install_yarn_deps
    setup_husky
    
    echo ""
    verify_installation
    
    echo ""
    print_success "Setup complete! 🎉"
    echo ""
    print_info "Next steps:"
    echo "  1. Restart your terminal or run: source ~/.zshrc"
    echo "  2. Verify asdf versions: asdf current"
    echo "  3. Run project commands: yarn validate"
    echo ""
}

# Run main function
main "$@"
