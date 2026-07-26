# Publimetal

Sitio web estático de Publimetal con un Sanity Studio independiente para administrar proyectos.

## Estructura

- `index.html`: sitio web actual.
- `images/`: recursos visuales del sitio actual.
- `historia/`: página Trayectoria y catálogo histórico provisional.
- `studio/`: Sanity Studio conectado al proyecto Publimetal.

## Probar el sitio localmente

Inicia un servidor estático desde la raíz del repositorio y abre:

- Home: `http://localhost:PORT/`
- Trayectoria: `http://localhost:PORT/historia/`

## Ejecutar Sanity Studio

```bash
cd studio
npm install
npm run dev
```

El Studio estará disponible en `http://localhost:3333`.

La web actual no consume datos desde Sanity en esta etapa.
