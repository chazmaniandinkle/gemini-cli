# gemini-cli - Development Context

## Project Overview
A custom fork of Google's Gemini CLI with enhanced capabilities including Eidolon orchestrator integration, Ollama local model support, and multi-backend architecture. Provides advanced AI agent capabilities while maintaining compatibility with upstream Gemini CLI features.

## Git Workflow Strategy
**Strategy**: Fork-Based Development Strategy

### Workflow Details
- **Main Branch**: `main` - Synced with upstream for contributions and compatibility
- **Private Development Branch**: `private-dev` - Custom modifications and enhancements
- **Upstream Remote**: `upstream` - Google's official Gemini CLI repository
- **Origin Remote**: `origin` - Personal fork repository

### Branch Usage Guidelines
- **Sync `main` regularly** with upstream to stay current
- **All custom development on `private-dev`** branch
- **Feature branches** from `private-dev` for major enhancements
- **Contribution flow**: `main` → upstream (for open source contributions)
- **Custom flow**: `feature/*` → `private-dev` (for private enhancements)

## Development Guidelines
- Follow TypeScript/Node.js best practices and existing CLI patterns
- Maintain compatibility with upstream Gemini CLI APIs where possible
- Update orchestrator documentation when modifying backend integrations
- Test multi-backend functionality (Gemini, Eidolon, Ollama) before merging
- Keep custom modifications well-documented for future upstream integration
- Use descriptive commit messages distinguishing custom vs upstream changes

## Architecture Notes
- **TypeScript CLI application** built on Google's Gemini CLI foundation
- **Multi-backend orchestrator** supporting Gemini, Eidolon, and Ollama
- **Enhanced inference factory** with modular backend architecture
- **Custom UI components** including model switcher and enhanced auth
- **Data-oasis integration** for advanced data processing capabilities
- **Backward compatibility** with original Gemini CLI functionality

## Development Environment
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development mode
npm run start

# Run tests
npm test

# Run with custom orchestrator
npm run dev -- --orchestrator eidolon

# Test different backends
gemini --model gemini-pro
gemini --model ollama:llama2
gemini --orchestrator eidolon
```

## Key Files and Directories
- `packages/cli/` - CLI interface with custom enhancements
- `packages/core/` - Core functionality with orchestrator integration
- `packages/core/src/orchestrator.ts` - Multi-backend orchestration logic
- `packages/core/src/inference/` - Inference factory and backend implementations
- `packages/core/src/data-oasis/` - Data processing enhancements
- `packages/cli/src/ui/components/ModelSwitcher.tsx` - Backend selection UI
- `MIGRATION.md` - Fork strategy documentation

## Current Development Focus
Fork-Based Development Strategy with active enhancements:
- **Multi-backend orchestration**: Seamless switching between AI providers
- **Eidolon integration**: Advanced agent capabilities and orchestration
- **Ollama support**: Local model inference and privacy-focused AI
- **Enhanced UI**: Improved model selection and configuration interfaces
- **Upstream compatibility**: Maintaining sync with Google's developments

## Dependencies and Integration
- **Google Gemini CLI**: Upstream base with regular sync requirements
- **Eidolon Orchestrator**: Advanced AI agent coordination platform
- **Ollama**: Local large language model inference
- **TypeScript/Node.js**: Core runtime and build system
- **React/Ink**: Terminal UI framework for enhanced interfaces
- **Custom inference factory**: Modular backend architecture

## Notes and Context
- **Production-ready fork** with enhanced capabilities beyond upstream
- **Multi-backend support** enabling local and cloud AI model usage
- **Orchestrator integration** providing advanced agent coordination
- **Upstream sync strategy** for ongoing compatibility and contributions
- **Privacy-focused enhancements** with local model support via Ollama
- **Well-documented customizations** for potential upstream contribution
- **Active development** balancing custom features with upstream compatibility