---
description: "Generic code review instructions that can be customized for any project using GitHub Copilot"
applyTo: "**"
excludeAgent: ["coding-agent"]
---

# Generic Code Review Instructions

## Review Language

Respond in **English**.

## Review Priorities

### 🔴 CRITICAL (Block merge)

- **Security**: Vulnerabilities, exposed secrets, authentication/authorization issues
- **Correctness**: Logic errors, data corruption risks, race conditions
- **Breaking Changes**: API contract changes without versioning
- **Data Loss**: Risk of data loss or corruption

### 🟡 IMPORTANT (Requires discussion)

- **Code Quality**: Severe SOLID violations, excessive duplication
- **Test Coverage**: Missing tests for critical paths or new functionality
- **Performance**: Obvious bottlenecks (N+1 queries, memory leaks)
- **Architecture**: Significant deviations from established patterns

### 🟢 SUGGESTION (Non-blocking)

- **Readability**: Poor naming, overly complex logic
- **Optimization**: Performance improvements without functional impact
- **Best Practices**: Minor convention deviations
- **Documentation**: Missing or incomplete comments/docs

## General Principles

1. **Be specific**: Reference exact lines, files; provide concrete examples
2. **Provide context**: Explain WHY something is an issue and the impact
3. **Suggest solutions**: Show corrected code, not just problems
4. **Be constructive**: Focus on improving the code, not criticizing the author
5. **Recognize good practices**: Acknowledge well-written code
6. **Be pragmatic**: Not every suggestion needs immediate implementation
7. **Group related comments**: Avoid duplicate comments on the same topic

## Code Quality Standards

### Clean Code

- Descriptive, meaningful names for variables, functions, and classes
- Single Responsibility Principle: each function/class does one thing well
- DRY: no code duplication
- Functions should be small and focused (ideally < 20\u201330 lines)
- Avoid deeply nested code (max 3\u20134 levels)
- Use constants instead of magic numbers and strings
- Code should be self-documenting; comments only when necessary

```javascript
// \u274c BAD: Poor naming and magic numbers
function calc(x, y) {
  if (x > 100) return y * 0.15;
  return y * 0.1;
}

// \u2705 GOOD: Clear naming and constants
const PREMIUM_THRESHOLD = 100;
const PREMIUM_DISCOUNT_RATE = 0.15;
const STANDARD_DISCOUNT_RATE = 0.1;

function calculateDiscount(orderTotal, itemPrice) {
  const discountRate =
    orderTotal > PREMIUM_THRESHOLD
      ? PREMIUM_DISCOUNT_RATE
      : STANDARD_DISCOUNT_RATE;
  return itemPrice * discountRate;
}
```

### Error Handling

- Proper error handling at appropriate levels
- Meaningful error messages
- No silent failures or ignored exceptions
- Fail fast: validate inputs early
- Use appropriate error types/exceptions

## Security Review

- **Sensitive Data**: No passwords, API keys, tokens, or PII in code or logs
- **Input Validation**: All user inputs validated and sanitized
- **SQL Injection**: Use parameterized queries, never string concatenation
- **Authentication**: Proper auth checks before accessing resources
- **Authorization**: Verify user has permission to perform action
- **Cryptography**: Use established libraries, never custom crypto
- **Dependency Security**: Check for known vulnerabilities

```java
// \u274c BAD: SQL injection vulnerability
String query = "SELECT * FROM users WHERE email = '" + email + "'";

// \u2705 GOOD: Parameterized query
PreparedStatement stmt = conn.prepareStatement(
    "SELECT * FROM users WHERE email = ?"
);
stmt.setString(1, email);
```

## Testing Standards

- **Coverage**: Critical paths and new functionality must have tests
- **Test Names**: Descriptive names explaining what is being tested
- **Test Structure**: Clear Arrange-Act-Assert or Given-When-Then pattern
- **Independence**: Tests must not depend on each other or external state
- **Assertions**: Use specific assertions, avoid generic assertTrue/assertFalse
- **Edge Cases**: Test boundary conditions, null values, empty collections
- **Mock Appropriately**: Mock external dependencies, not domain logic

```typescript
// \u274c BAD: Vague name and assertion
test("test1", () => {
  const result = calc(5, 10);
  expect(result).toBeTruthy();
});

// \u2705 GOOD: Descriptive name and specific assertion
test("should calculate 10% discount for orders under $100", () => {
  const orderTotal = 50;
  const itemPrice = 20;
  const discount = calculateDiscount(orderTotal, itemPrice);
  expect(discount).toBe(2.0);
});
```

## Performance Considerations

- **Database Queries**: Avoid N+1 queries, use proper indexing
- **Algorithms**: Appropriate time/space complexity for the use case
- **Caching**: Utilize caching for expensive or repeated operations
- **Resource Management**: Proper cleanup of connections, files, streams
- **Pagination**: Large result sets should be paginated
- **Lazy Loading**: Load data only when needed

```python
# \u274c BAD: N+1 query problem
users = User.query.all()
for user in users:
    orders = Order.query.filter_by(user_id=user.id).all()  # N+1!

# \u2705 GOOD: Use JOIN or eager loading
users = User.query.options(joinedload(User.orders)).all()
for user in users:
    orders = user.orders
```

## Architecture and Design

- **Separation of Concerns**: Clear boundaries between layers/modules
- **Dependency Direction**: High-level modules don't depend on low-level details
- **Interface Segregation**: Prefer small, focused interfaces
- **Loose Coupling**: Components should be independently testable
- **High Cohesion**: Related functionality grouped together
- **Consistent Patterns**: Follow established patterns in the codebase

## Documentation Standards

- **API Documentation**: Public APIs must be documented (purpose, parameters, returns)
- **Complex Logic**: Non-obvious logic should have explanatory comments
- **README Updates**: Update README when adding features or changing setup
- **Breaking Changes**: Document any breaking changes clearly
- **Examples**: Provide usage examples for complex features

## Comment Format Template

```markdown
**[PRIORITY] Category: Brief title**

Detailed description of the issue or suggestion.

**Why this matters:**
Explanation of the impact or reason.

**Suggested fix:**
[code example if applicable]

**Reference:** [link to relevant documentation or standard]
```

## Review Checklist

- [ ] Code follows consistent style and conventions
- [ ] Names are descriptive; functions are small and focused
- [ ] No code duplication or commented-out code without tickets
- [ ] Error handling is appropriate
- [ ] No sensitive data in code or logs
- [ ] Input validation on all user inputs; no SQL injection
- [ ] Auth and authorization properly implemented
- [ ] Dependencies are up-to-date and secure
- [ ] New code has appropriate test coverage (including edge cases)
- [ ] Tests are well-named, focused, independent, and deterministic
- [ ] No obvious performance issues (N+1, memory leaks)
- [ ] Appropriate use of caching; efficient algorithms
- [ ] Proper resource cleanup
- [ ] Follows established architectural patterns; proper separation of concerns
- [ ] Public APIs are documented; README updated if needed
- [ ] Breaking changes are documented
