# Enriquecimiento desde MercadoLibre

Generado el 2026-08-14 17:24 por `scripts/ml-report.ts`.
No editar a mano: se regenera entero. La fuente es `data/ml-progress.jsonl`.

## Resumen

| | Productos | |
|---|---:|---:|
| Procesados | 1574 | |
| Con ficha encontrada | 822 | 52% |
| — con specs | 777 | 49% |
| — con fotos | 809 | 51% |
| — con descripción | 748 | 48% |
| Sin ficha | 752 | 48% |

Specs disponibles: **9372** · fotos disponibles: **2914**

## Aplicado a la tienda

- Contenido (specs + descripción) escrito en la DB: **777**
- Imágenes subidas a Cloudinary y asociadas: **809**

## Por qué falló

| Motivo | Productos |
|---|---:|
| el EAN no existe en el catálogo de ML | 70 |
| [nombre] N candidato(s), ninguno válido: nuestro nombre no tiene ninguna dimensión que permita validar | 38 |
| [nombre] N candidato(s), ninguno válido: diferencia en mm: nuestro N contra ML (no dice) | 23 |
| [nombre] N candidato(s), ninguno válido: variante largo distinta: nuestro (no dice) contra ML largo | 20 |
| hubo N resultado(s) pero ninguno con GTIN igual al SKU | 18 |
| [nombre] N candidato(s), ninguno válido: marca distinta: nuestra "Rutmann", ML "Ruhlmann" | 14 |
| [nombre] N candidato(s), ninguno válido: marca distinta: nuestra "Dorrego", ML "Imbra" | 13 |
| [nombre] N candidato(s), ninguno válido: marca distinta: nuestra "Eurotech", ML "Bodegas Mumm" | 12 |
| [nombre] N candidato(s), ninguno válido: el nuestro es una unidad suelta y la ficha es un juego | 12 |
| [nombre] N candidato(s), ninguno válido: variante color distinta: nuestro (no dice) contra ML gris | 12 |
| [nombre] N candidato(s), ninguno válido: marca distinta: nuestra "DeWALT", ML "Wembley" | 10 |
| [nombre] N candidato(s), ninguno válido: la ficha de ML no declara marca | 10 |

## Por marca

| Marca | Procesados | Con ficha | Con fotos |
|---|---:|---:|---:|
| Bremen | 486 | 441 | 440 |
| Eurotech | 317 | 21 | 18 |
| Bosch | 103 | 71 | 69 |
| Rutmann | 73 | 0 | 0 |
| Lusqtoff | 72 | 65 | 63 |
| DeWALT | 61 | 50 | 50 |
| GD Tools | 57 | 0 | 0 |
| Davidson | 29 | 0 | 0 |
| Omaha | 22 | 14 | 13 |
| PZ Force | 21 | 0 | 0 |
| Rucci | 21 | 2 | 2 |
| Gamma | 19 | 19 | 19 |
| Stanley | 18 | 8 | 8 |
| (sin marca) | 18 | 15 | 15 |
| EMTOP | 18 | 10 | 9 |
| Siloc | 16 | 13 | 13 |
| WADFOW | 15 | 11 | 10 |
| INGCO | 15 | 11 | 11 |
| Crossmaster | 13 | 3 | 3 |
| Dorrego | 13 | 0 | 0 |
| 3M | 11 | 3 | 3 |
| Wembley | 10 | 10 | 9 |
| Argentec | 8 | 0 | 0 |
| Bemar | 7 | 0 | 0 |
| Ezeta | 7 | 0 | 0 |

## Revisar a mano

Productos cuyo EAN devolvió más de una ficha del catálogo. Se eligió la más completa, pero conviene mirarlos.

| SKU | Nuestro nombre | Ficha elegida | Fichas |
|---|---|---|---:|
| `1210001969322` | Mate Stanley 236ml Rosa | Mate Termico 236ml Stanley Classic Inoxidable Sin Bpa Rosa Color Rosa claro Liso | 2 |
| `3165140059084` | Broca 5mm en Espiral para Madera | Taladro para madera en espiral Bosch de 5 mm | 2 |
| `3165140518543` | S Copa Bimetalica 76mm Ree A2 Bosch | Sierra Copa Bosch Bimetalica Hss 76 Mm | 2 |
| `3165140568746` | Hoja de Calar Madera Bosch (Corte Limpio) - Blister x 5 Unidades | Hojas de sierra Tico Tico 2608667304 Bosch T101ao de 51 x 1,4 mm, 5 unidades | 2 |
| `3165140568753` | Hoja de Calar Madera (Corte Limpio) - Blister x 5 Unidades | Set 5 Hojas De Calar Tipo T Bosch T101b 2608667305 | 2 |
| `3165140568883` | Hojas para Caladora X5 Bosch para Chapas de Metal Muy Finas 36 Dientes | Hojas De Sierra Bosch Para Caladora - Set Recto - Metal | 2 |
| `3165140880596` | Disco de Sierra Circular Eco1 Bosch 2608644331 | Disco De Sierra Circular Bosch Eco 184mm 60 Dientes Madera | 2 |
| `4006825613704` | Pxc Starter Kit Bateria 4.0 AH + Cargador 18V Einhell | Sierra caladora industrial inalámbrica Einhell TE-JS 18 LI 4AH | 2 |
| `4059952524771` | Disco de Corte 180x1.6mm Eco Bosch | Kit de discos de corte de metal Bosch de 7 x 1/16 pulgadas x 7/8 | 2 |
| `4059952538754` | Mecha 10mm HEX-9 Multiconstruccion | Broca Multimaterial Multconstruction 10mm Bosch Hex9 | 2 |
| `4059952542607` | Disco de Lija Expert C470 150mm P180 Bosch | Disco de lijado Expert C470, 150 mm, G180, 50, Bosch Gravel, cantidad 180 | 2 |
| `6925582140064` | Tripode para Nivel Laser INGCO | Tripode 1,2m Aluminio Ingco Con Base Rosca Para Nivel Laser | 2 |
| `6941640166333` | Set Repuesto Trincheta 10 Unidades 18mm INGCO | Repuesto Cartonero 10 Hojas Corta Carton Exacto 18mm Ingco | 2 |
| `6943475863753` | Juego Puntas Atornillar 45 Pzas CAT | Set Puntas Impacto Cat 45 Pzs Con Estuche Plástico | 2 |
| `6949509205810` | Mecha SDS PLUS-1 6X110 | Mecha Bosch Sds Plus 6 Mm 50 / 110 Mm Para Hormigon | 2 |
| `6949509205896` | Mecha SDS PLUS-1 8X160 | Broca Widia Sds Plus 8 X 160 Mm - Bosch | 2 |
| `6949509205926` | Mecha SDS PLUS-1 10X160 | Mecha Sds Plus-1 - 10 Mm X 160 Mm Bosch 2608680273 | 2 |
| `6949509205964` | Mecha SDS PLUS-1 12X160 | Broca Bosch Sds Plus-1 de 2 filos con 2 filos Ø12x100x160 mm | 2 |
| `7795163023890` | Calibre Digital Acero 150mm (Visor Plastico) Wembley | Calibre Digital Visor Plastico 150mm Con Estuche Wembley | 2 |
| `7795163029144` | Aut.Compresometro 3 a 21kg/cm2 Bremen | Compresometro Bremen Motos Autos Profesional Nafta Cod. 2914 | 2 |
| `7795163034759` | Bocallave Enc.1/2mm 23mm Est. CrVa Bremen | Bocallave Tubo Estriado Enc 23mm 1/2 Bremen 3475 Color Plateado | 2 |
| `7795163034865` | Bocallave Enc.1/2SAE(12) 1/2 Est.CrVa Bremen | Tubo Bocallave Estriada 1/2 Encastre 1/2 Bremen 3486 Color Cromado | 2 |
| `7795163035039` | Llave Combinada mm 6 Profesional Bremen | Llave Combinada Bremen 6 Mm Profesional Acero Cr-vanadio Cod. 3503 | 2 |
| `7795163035053` | Llave Combinada mm 8 Profesional Bremen | Juego Llaves Combinadas Bremen 6mm A 13mm Cromo Vanadio | 2 |
| `7795163035091` | Llave Combinada mm 12 Profesional Bremen | Llave Combinada M12 Profesional Bremen 3509 Plateado | 2 |
| `7795163035107` | Llave Combinada mm 13 Profesional Bremen | Llave Combinada Bremen 13 Mm Profesional Acero Cr-vanadio Cod. 3510 Dgm | 2 |
| `7795163035114` | Llave Combinada mm 14 Profesional Bremen | Llave Combinada Bremen 3511 Color Plateado Con Acabado Mate | 2 |
| `7795163035251` | Llave COMB.SAE(11) 7/16PROFESIONAL Bremen® | Llave Combinada Bremen Sae 7/16 Profesional Otro | 2 |
| `7795163035527` | Llave Combinada mm 24 Profesional Bremen | Set Juego 19 Llaves Combinada Acodada 6 A 24mm Taller Bremen | 2 |
| `7795163036210` | Llave Combinada mm 32 Profesional Bremen | Set Juego 26 Llaves Combinada Acodada 6 A 32mm Taller Bremen | 2 |
| `7795163037651` | Adaptador 1/4 Hembra x 3/8Macho CrVa Bremen | Adaptador Tubos 1/4 Hembra 3/8 Macho Cr-vanadio Bremen 3765 | 2 |
| `7795163037668` | Adaptador 3/8Hembra x 1/4Macho CrVa Bremen | Adaptador Tubos 3/8 Hembra 1/4 Macho Bremen Bocallaves 3766 | 2 |
| `7795163037675` | Adaptador 3/8Hembra x 1/2Macho CrVa Bremen | Adaptador Llave Tubo Bremen 3/8 Hembra - 1/2 Macho Cod. 3767 Dgm | 2 |
| `7795163037699` | Adaptador 1/2Hembra x 3/4Macho CrVa Bremen | Adaptador Tubos Bocallave 1/2 Hembra 3/4 Macho Bremen 3769 | 2 |
| `7795163037774` | Bocallave Enc.3/4 24mm Hex. CrVa Bremen | Llave Tubo Bremen 3777 Color Plateado Con Acabado Cromado | 2 |
| `7795163038214` | Bocallave Enc.1/2 mm 12mm Hex. CrVa Bremen | Bocallave Enc.1/2 Mm 12mm Hex. Crva Bremen 3821 | 2 |
| `7795163038245` | Bocallave Enc.1/2 mm 15mm Hex. CrVa Bremen | Llave Tubo Bocallave 15mm Encastre 1/2 Hexagonal Bremen 3824 | 2 |
| `7795163038252` | Bocallave Enc.1/2 mm 16mm Hex. CrVa Bremen | 3825 Llave Tubo Bremen 16 Mm Enc 1/2 Hexagonal Corto | 2 |
| `7795163038306` | Bocallave Enc.1/2 mm 21mm Hex. CrVa Bremen | Llave Tubo Bocallave 21mm Encastre 1/2 Hexagonal Bremen 3830 | 2 |
| `7795163038344` | Bocallave Enc.1/2 mm 25mm Hex. CrVa Bremen | Llave Tubo 25 Mm Enc 1/2 Hexagonal Bremen 3834 Cromado | 2 |

…y 42 más.

