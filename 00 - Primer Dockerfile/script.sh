#!/bin/sh

if [ -f "dummy" ]; then
  # El archivo existe, ejecutar el comando deseado
  echo "Muy bien, has creado tu primera imagen, vamos a continuar con cómo lanzar contenedores, https://hub.docker.com/r/josesanc02/taller-01..."
else
  # El archivo no existe
  echo "El archivo 'dummy' no existe, de momento no puedo decirte cómo continuar."
fi