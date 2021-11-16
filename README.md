# BA Verlaufsplaner

Bachelorarbeit von Maximilian Azendorf

Der Master ist immer unter [ba.azendorf.com](https://ba.azendorf.com) deployed.

## Technologie-Stack

- [NX 12](https://nx.dev/) als Projektverwaltung
- [CouchDB](https://couchdb.apache.org/) als Datenbank
- [Nest 7](https://nestjs.com/) als Node-basiertes Backend-Framework
- [Angular 12](https://angular.io/) als Frontend-Framework
- [Spectre.CSS](https://picturepan2.github.io/spectre/) als CSS-only UI-Framework
- [JAM Icons](https://jam-icons.com/) als Icon-Bibliothek

Außerdem
- [Jest](https://jestjs.io/) als Test-Framework
- [Cypress](https://www.cypress.io/) als E2E-Test-Framework
- [Compodoc](https://compodoc.app/) als Doc-Generator
- [Docker](https://www.docker.com/)

Das Projekt benutzt [yarn](https://yarnpkg.com/) als Paketverwaltung.

## Projektstruktur

- [apps/](apps) &ndash; Die einzelnen NX Apps (Frontend, Backend etc.)
  - [api/](apps/api) &ndash; Das Backend
  - [client/](apps/client) &ndash; Das Frontend
  - [client-e2e/](apps/client-e2e) &ndash; End-to-End-Tests für das Frontend
- [libs/](libs) &ndash; Die einzelnen NX Libraries, die von Apps geteilten Code beinhalten
  - [api-interfaces/](libs/api-interfaces) &ndash; Enthält Datenmodell-Interfaces, die den Datenbankzustand abbilden und 
    Code, um mit der CouchDB-Datenbank zu interagieren
  - [utility/](libs/utility) &ndash; Enthält Framework-unabhängigen Code (z.B. Implementationen von Algorithmen)
- [deploy/](deploy) &ndash; Enthält CD-spezifische Docker-/docker-compose-files und ein Skript, um ein Docker-Image 
  zusammen mit einem vorkonfigurierten CouchDB Image zu bauen.

## Deployment

Das Backend generiert signierte JWT-Access-Tokens, mit der sich das Frontend bei der CouchDB-Instanz authentifizieren 
kann. Damit das möglich ist, muss sowohl die CouchDB-Instanz als auch das Backend über den selben HMAC-Schlüssel
verfügen.

Das Skript [deploy/build.sh](deploy/build.sh) generiert einen solchen Schlüssel und erstellt sowohl ein App- als auch
ein CouchDB-Image mit diesem genertierten Schlüssel.
