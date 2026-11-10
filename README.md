# Allindiajobs

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Job icons

Sign in to the admin page and choose one of 20 icons in the Create Job or Edit Job modal. The selected icon appears in place of the job thumbnail on the home page. Older jobs without an icon continue to use their existing image or default thumbnail. Job XLS downloads include a `JobIcon` column; imports accept the same optional column with a `bi-*` name from the admin icon picker.

The home page displays job cards with an image or icon above the company name, alongside recent government and walk-in opportunities. Below the recent lists, job type and company filters narrow the main listings. The company filter shows a stable random sample of up to 50 available companies, keeping the selected company visible. Listings, WhatsApp updates, sharing, and pagination remain available on desktop and mobile.

The logo, search, and menu bar stays fixed while the scrollable category navigation moves with the page. The compact mobile menu groups job categories and the game link in a scrollable panel.

On mobile, the footer offers an Install app button. It opens the browser's installation prompt when available; otherwise it shows Add to Home Screen instructions for the user's browser. Installation availability depends on the browser and its requirements.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
