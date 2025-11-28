FROM nginx:stable-alpine

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy only the frontend static files into nginx html
# The frontend source is in the `frontend/` directory
COPY frontend/ /usr/share/nginx/html/

# Copy custom nginx config
COPY docker/frontend/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
