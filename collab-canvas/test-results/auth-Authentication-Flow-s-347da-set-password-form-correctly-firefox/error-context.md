# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Reset your password" [level=2] [ref=e6]
    - paragraph [ref=e7]: Enter your new password below
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e15]: New Password
      - textbox "New Password" [ref=e18]:
        - /placeholder: Enter your new password
    - generic [ref=e19]:
      - generic [ref=e22]: Confirm Password
      - textbox "Confirm Password" [ref=e25]:
        - /placeholder: Confirm your new password
    - button "Update Password" [ref=e27]
  - paragraph [ref=e29]:
    - text: Remember your password?
    - link "Sign in here" [ref=e30] [cursor=pointer]:
      - /url: /login
```