# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "Sign in to CollabCanvas" [level=2] [ref=e6]
    - paragraph [ref=e7]:
      - text: Or
      - link "create a new account" [ref=e8] [cursor=pointer]:
        - /url: /signup
  - generic [ref=e9]:
    - heading "Sign in to your account" [level=3] [ref=e11]
    - generic [ref=e13]:
      - generic [ref=e14]:
        - generic [ref=e17]: Email address*
        - textbox "Email address*" [disabled] [ref=e20]:
          - /placeholder: Enter your email
      - generic [ref=e21]:
        - generic [ref=e24]: Password*
        - textbox "Password*" [disabled] [ref=e27]:
          - /placeholder: Enter your password
      - generic [ref=e28]:
        - generic [ref=e29]:
          - checkbox "Remember me" [ref=e31]
          - generic [ref=e33]: Remember me
        - link "Forgot your password?" [ref=e34] [cursor=pointer]:
          - /url: /forgot-password
      - button "Signing in..." [disabled] [ref=e36]: Signing in...
      - generic [ref=e38]:
        - generic [ref=e43]: Or continue with
        - button "Sign in with magic link" [disabled] [ref=e45]: Sign in with magic link
  - paragraph [ref=e48]:
    - text: Don't have an account?
    - link "Sign up here" [ref=e49] [cursor=pointer]:
      - /url: /signup
```