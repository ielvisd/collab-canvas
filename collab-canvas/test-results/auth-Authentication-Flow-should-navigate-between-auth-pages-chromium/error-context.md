# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Reset your password" [level=2] [ref=e6]
    - paragraph [ref=e7]: Enter your email address and we'll send you a link to reset your password.
  - generic [ref=e8]:
    - heading "Password reset" [level=3] [ref=e10]
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e16]: Email address*
        - textbox "Email address*" [disabled] [ref=e19]:
          - /placeholder: Enter your email
      - button "Sending reset link..." [disabled] [ref=e21]: Sending reset link...
  - paragraph [ref=e24]:
    - text: Remember your password?
    - link "Sign in here" [ref=e25] [cursor=pointer]:
      - /url: /login
```