FROM nginx:alpine

# Copiar los archivos de construcción ya existentes al directorio de nginx
COPY dist/ /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"] 