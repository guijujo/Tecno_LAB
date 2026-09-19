# Diagramas del proyecto

Tres diagramas del Registro Emocional, cada uno en un HTML autocontenido
que se abre sin instalar nada. Traen tema claro/oscuro, vistas guiadas y
exportación a imagen desde la barra superior.

| Archivo | Qué muestra |
|---|---|
| [`arquitectura.html`](arquitectura.html) | Las piezas del proyecto y qué queda dentro del dispositivo |
| [`datos.html`](datos.html) | El recorrido de un registro, de la carga a las vistas |
| [`flujo.html`](flujo.html) | El camino de registrar una emoción, con la rama de acompañamiento |

## Cómo se regeneran

Los HTML están generados; lo que se edita son las fuentes de
[`fuentes/`](fuentes). Se rearman con la skill
[archify](https://github.com/guijujo/archify):

```bash
node bin/archify.mjs deliver architecture arquitectura.json arquitectura.html --quality showcase
node bin/archify.mjs deliver dataflow     datos.json        datos.html        --quality showcase
node bin/archify.mjs deliver workflow     flujo.json        flujo.html        --quality showcase
```

`deliver` valida antes de escribir y falla si la composición no cumple el
perfil `showcase`, así que un diagrama que se entrega es un diagrama que
pasó los controles.
