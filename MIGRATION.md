# gemini-cli - Migration Guide

## Current Status
- **Git Status**: ✅ Initialized and clean
- **Remote Status**: ✅ Fork of upstream with custom branch
- **Branch**: `eidolon-cli` (up to date with origin)
- **Commits**: 10+ commits with custom Eidolon CLI integration
- **Working Tree**: Clean (no uncommitted changes)

## Remote Configuration
- **Origin**: https://github.com/chazmaniandinkle/gemini-cli.git (PUBLIC FORK)
- **Upstream**: https://github.com/google-gemini/gemini-cli.git (OFFICIAL)
- **Type**: Fork with custom modifications

## Target Git Workflow Strategy
**Fork-Based Development Strategy**

### Workflow Details
- **main branch**: Track upstream releases
- **eidolon-cli branch**: Custom Eidolon CLI development (CURRENT)
- **development branch**: Private development work
- **feature branches**: `feature/*` from development
- **Architecture**: TypeScript-based CLI with custom orchestrator integration

## Migration Steps Required

### 1. Create Development Branch from Current Work
```bash
git checkout -b development
git push -u origin development
```

### 2. Setup Upstream Tracking
```bash
# Ensure upstream is properly configured
git remote -v
# upstream should already be set to google-gemini/gemini-cli

# Update main branch to track upstream
git checkout main
git pull upstream main
git push origin main
```

### 3. Rebase Custom Work onto Development
```bash
# The eidolon-cli branch contains custom work
git checkout development
git merge eidolon-cli
git push origin development
```

### 4. Update Documentation
- ✅ README.md exists (comprehensive upstream docs)
- ✅ Extensive documentation in docs/
- [ ] Add DEVELOPMENT.md for custom fork workflow
- [ ] Document Eidolon CLI integration

## Documentation Status
- ✅ README.md exists (upstream comprehensive docs)
- ✅ docs/ directory with extensive documentation
- ✅ CONTRIBUTING.md exists (upstream)
- [ ] DEVELOPMENT.md needed for fork workflow
- [ ] EIDOLON.md for custom integration documentation

## Branch Analysis
- **main**: Tracks upstream Google Gemini CLI
- **eidolon-cli**: Custom Eidolon CLI integration (CURRENT)
- **local-ollama-auth-provider**: Local Ollama integration
- Multiple upstream branches available

## Technology Stack
- **Primary**: TypeScript/Node.js
- **CLI Framework**: Custom Google Gemini CLI
- **Integration**: Eidolon orchestrator system
- **Authentication**: Google/Ollama providers
- **Architecture**: CLI with sandbox integration
- **Build System**: esbuild, npm scripts

## Custom Modifications
- **Eidolon CLI Integration**: Custom orchestrator integration
- **Ollama Support**: Local LLM provider integration
- **Architecture Refactoring**: Foundational Eidolon CLI architecture
- **Streaming UI**: Enhanced user interface with streaming

## Upstream Synchronization Strategy
- **Frequency**: Monthly upstream synchronization
- **Conflicts**: Resolve custom changes with upstream updates
- **Testing**: Validate custom features after upstream merges
- **Documentation**: Maintain separate docs for custom features

## Special Considerations
- **Fork Maintenance**: Regular upstream synchronization required
- **Custom Features**: Eidolon orchestrator integration
- **Ollama Integration**: Local LLM provider support
- **Architecture Changes**: Significant refactoring from upstream

## Notes
- **Priority**: MEDIUM - Custom fork with specialized features
- **Risk Level**: MEDIUM - Fork maintenance complexity
- **Dependencies**: Upstream Google Gemini CLI
- **Special Considerations**:
  - Fork of official Google Gemini CLI
  - Custom Eidolon orchestrator integration
  - Local Ollama LLM provider support
  - Significant architectural modifications
  - Requires ongoing upstream synchronization
  - Good candidate for specialized development workflow
  - May benefit from separate documentation for custom features