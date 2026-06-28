# TODO

- [ ] Fix persistent auto-login on site start by removing/limiting use of `localStorage.getItem('servego_user')`.
- [ ] Decide UX: start logged out (clear session on startup) or use "remember me" checkbox.
- [ ] Implement fix in `frontend/src/context/AppContext.jsx` (and any related logout handling).
- [ ] Ensure login still works correctly after manual login.
- [ ] Run frontend (`npm start`) to verify.

