### About 

#### initialize project 
```bash
npm init -y
```

#### install nodemon (for monitoring) 
```bash
npm i -g nodemon 
```
to run it
```bash
nodemon app.js
```

#### install express
```bash
npm i express
```

```js
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
    res.send('Hello Users')
})

app.listen(4000, () => {
    console.log('Express is listening on port 4000');
});
```


#### GET /users

axios:
```js
const resp = await axios.get('/users');
console.log(resp);
```

express: 
```js
app.get('/users', (req, res) => {
    const users = new DB('users');
    res.send(users.get()); //users list
})
```


#### POST /users

axios:
```js
const resp = await axios.post('/users', { name: 'Mosh' });
console.log(resp); //newUser
```

express: 
```js
app.use(express.json());
```

```js
app.post('/users', (req, res) => {
    const users = new DB('users');
    const newUser = users.add(req.body);

    res.send(newUser)
})
```