# Allindiajobs

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.1.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

Category filters use `/jobcategories/<category>` URLs, such as
`/jobcategories/government-jobs` and `/jobcategories/walk-ins`. Searches use the
`q` query parameter and can be combined with a category. The Top 6 jobs appear
only on the unfiltered home page. Older `?category=government` filter links
remain supported.

The menu expands Government jobs into Current jobs, Upcoming jobs, Results, and
Syllabus. Private jobs expand into job types, Walk-in/Non-walk-in hiring types,
and Fresher/Experienced options. Each option opens its own category URL; private
options exclude government listings. The drawer scrolls to keep all links
accessible on mobile.

Footer Quick links include the same category options in expandable Government
and Private groups, alongside all jobs, walk-in drives, and official career links.

The publisher dashboard shows 50 published jobs per page, with Previous/Next
controls. Search and job-type changes return to the first page. Export XLS
continues to export all jobs, not just the visible page.

Job sharing includes the title, job-details link, available application/walk-in
dates, and a message encouraging sharing with job seekers. Browsers without
native sharing copy the complete message to the clipboard instead.

Create/Edit job includes an optional YouTube video URL, empty by default.
Valid watch, short-link, Shorts, live, and embed URLs display a responsive video
on the job-details page using YouTube's privacy-enhanced player. Spreadsheet
import/export preserves this field as `YouTube URL`.
The site's Content Security Policy permits `https://www.youtube-nocookie.com`
in `frame-src` for this embedded player.
The video section also offers a direct YouTube link for browsers that cannot
play the embed, including embedded previews with limited media-codec support.

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
