# Styling conventions

This directory currently contains no runtime stylesheet. Essential chart styles
are self-contained inline React styles, with palette/CSS-variable helpers in
`internal/svg/presentation.ts` and frame/inspection styling alongside renderers.
Consumers do not need to import a CSS file.

Keep chart essentials independent of the playground and website stylesheets.
Those applications own their page layout and branding. Existing CSS-variable
fallbacks are implementation conventions, not a complete stable theme API;
strict CSP and arbitrary host-style compatibility remain unverified.
