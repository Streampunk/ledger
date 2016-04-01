FROM    nodesource/trusty:4.1

# Install app dependencies
COPY package.json /src/package.json
RUN cd /src; npm install --production

# Bundle app source
COPY . /src

EXPOSE  8080
# CMD ["node", "/src/index.js"]