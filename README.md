# MiniSpa

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.0.

## Structure

```
src/
├── environments/
│   └── environment.ts
│
└── app/
    ├── app.ts
    ├── app.spec.ts
    ├── app.config.ts
    ├── app.config.server.ts
    ├── app.html
    ├── app.css
    ├── app.routes.ts
    ├── app.routes.server.ts
    │
    ├── models/
    │   ├── organizacion.model.ts
    │   └── usuario.model.ts
    │
    ├── services/
    │   ├── organizacion.service.ts
    │   ├── organizacion.spec.ts
    │   ├── usuario.service.ts
    │   └── usuario.spec.ts
    │
    ├── organizacion-list/
    │   ├── organizacion-list.ts
    │   ├── organizacion-list.html
    │   ├── organizacion-list.css
    │   └── organizacion-list.spec.ts
    │
    ├── usuario-list/
    │   ├── usuario-list.ts
    │   ├── usuario-list.html
    │   └── usuario-list.css
    │
    └── confirm-dialog/
        ├── organizacion-list.ts
        ├── organizacion-list.html
        ├── organizacion-list.css
        └── organizacion-list.spec.ts
```

---

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

To generate a new interface (models), run:

```bash
ng generate interface interface-name
```

To generate a new service, run:

```bash
ng generate service service-name
```

To generate a new pipe, run:

```bash
ng generate pipe pipe-name
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


## Exercici Angular - Websockets
# Tasques a realitzar:
Sincronitzar la interfície d'Angular amb esdeveniments asíncrons de Socket.io
# Ús de la IA:
He utilitzat Copilot per compendre pas a pas el que anava fent i així entendre l'us i l'aplicació de WebSockets.



