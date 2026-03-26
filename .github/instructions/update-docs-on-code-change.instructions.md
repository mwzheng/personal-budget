---
description: "Automatically update README.md and documentation files when application code changes require documentation updates"
applyTo: "**/*.{md,js,mjs,cjs,ts,tsx,jsx,py,java,cs,go,rb,php,rs,cpp,c,h,hpp}"
---

# Update Documentation on Code Change

Ensure documentation stays synchronized with code changes.

## When to Update Documentation

Check if documentation updates are needed when:

- New features or functionality are added
- API endpoints, methods, or interfaces change
- Breaking changes are introduced
- Dependencies or requirements change
- Configuration options or environment variables are modified
- Installation or setup procedures change
- CLI commands or scripts are updated
- Code examples in documentation become outdated

## Documentation Update Rules

### README.md

Update README.md when:

- **Adding features**: Add description to "Features" section, include usage examples, update table of contents
- **Changing setup**: Update "Installation"/"Getting Started", revise dependency/prerequisite lists
- **Adding CLI commands**: Document syntax, options, defaults, and examples
- **Changing configuration**: Update config examples, document new env vars, update config templates

### API Documentation

Sync API docs when:

- **New endpoints**: Document HTTP method, path, parameters; include request/response examples; update OpenAPI specs
- **Signature changes**: Update parameter lists, response schemas; document breaking changes
- **Auth changes**: Update authentication examples, security requirements, token documentation

### Code Examples

Verify and update code examples when:

- Function signatures change (update all snippets, verify they compile/run, update imports)
- API interfaces change (update example requests/responses, SDK examples)
- Best practices evolve (replace outdated patterns, add deprecation notices)

### Configuration Documentation

Update config docs when:

- **New env vars**: Add to `.env.example`, document in README or `docs/configuration.md` with defaults
- **Config structure changes**: Update example configs, document new options, mark deprecated ones
- **Deployment changes**: Update Docker/K8s configs, deployment guides, IaC examples

### Migration and Breaking Changes

Create migration guides when:

- Breaking API changes occur: document what changed, provide before/after examples, include step-by-step instructions
- Major version updates: list all breaking changes, provide upgrade checklist
- Deprecating features: mark clearly, suggest alternatives, include removal timeline

## Documentation File Structure

Maintain these files and update as needed:

- **README.md**: Project overview, quick start, basic usage
- **CHANGELOG.md**: Version history and user-facing changes
- **docs/**: Detailed documentation (`installation.md`, `configuration.md`, `api.md`, `contributing.md`, `migration-guides/`)
- **examples/**: Working code examples and tutorials

### Changelog Format

Use [Keep a Changelog](https://keepachangelog.com/) sections: Added, Changed (**BREAKING** prefix), Fixed, Deprecated, Removed, Security.

## Documentation Verification

Before applying changes, verify:

1. All new public APIs are documented
2. Code examples compile and run
3. Links in documentation are valid
4. Configuration examples are accurate
5. Installation steps are current
6. README.md reflects current state

## Quality Standards

- Use clear, concise language with consistent terminology
- Include working code examples (basic and advanced)
- Document edge cases and limitations
- Include error handling examples

### API Documentation Format

    ```markdown
    ### `functionName(param1, param2)`

    Brief description.

    **Parameters:**
    - `param1` (type): Description
    - `param2` (type, optional): Description with default

    **Returns:** `type` \u2014 Description

    **Throws:** `ErrorType` \u2014 When and why

    **Example:**
    \`\`\`language
    const result = functionName('value', 42);
    \`\`\`
    ```

## Automation and Tooling

- Use doc generators when available: JSDoc/TSDoc, Sphinx/pdoc, Javadoc, godoc, rustdoc
- Validate with: markdown linters (markdownlint), link checkers, spell checkers (cspell)
- Add pre-commit checks: docs build succeeds, no broken links, code examples valid, changelog entry exists

## Best Practices

- \u2705 Update documentation in the same commit as code changes
- \u2705 Test code examples before committing
- \u2705 Use consistent formatting and terminology
- \u2705 Document limitations and edge cases
- \u2705 Provide migration paths for breaking changes
- \u2705 Keep documentation DRY (link instead of duplicating)
- \u274c Don't commit code changes without updating documentation
- \u274c Don't leave outdated examples in documentation
- \u274c Don't document features that don't exist yet
- \u274c Don't document implementation details users don't need

## Maintenance Schedule

- **Monthly**: Review documentation for accuracy
- **Per release**: Update version numbers and examples
- **Quarterly**: Check for outdated patterns or deprecated features

### Deprecation Process

1. Add deprecation notice to documentation
2. Update examples to use recommended alternatives
3. Create migration guide and update changelog
4. Set timeline for removal; remove in next major version

## Review Checklist

- [ ] README.md reflects current project state
- [ ] All new features are documented
- [ ] Code examples are tested and work
- [ ] API documentation is complete and accurate
- [ ] Configuration examples are up to date
- [ ] Breaking changes are documented with migration guide
- [ ] CHANGELOG.md is updated
- [ ] Links are valid and not broken
- [ ] Installation instructions are current
- [ ] Environment variables are documented
