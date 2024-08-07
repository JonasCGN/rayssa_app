const express = require('express');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const app = express();
const port = 3000;

// Conecte-se ao Neo4j
const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD || 'neo4j/password')
);
const session = driver.session();

// Middleware para analisar o corpo das requisições como JSON
app.use(express.json());

app.get('/', (req, res) => {

    res.send('Hello World! ' + res);
});

// Rota para adicionar um novo nó
app.post('/produtos', async (req, res) => {
    const body = req.body;

    try {
        const result = await session.run(
            'CREATE (n:Produto {name: $name, price: $price, count: $count}) RETURN n',
            body
        );
        const singleRecord = result.records[0];
        const node = singleRecord.get(0);

        res.json({
            id: node.identity.toString(),
            ...node.properties
        });
    } catch (error) {
        res.status(500).send('Error product');
    }
});

// Rota para recuperar todos os nós Produtos
app.get('/produtos', async (req, res) => {
    try {
        const result = await session.run('MATCH (n:Produto) RETURN n');
        const people = result.records.map(record => {
            const node = record.get(0);
            return {
                id: node.identity.toString(),
                ...node.properties
            };
        });
        res.json(people);
    } catch (error) {
        res.status(500).send('Error retrieving product ' + error);
    }
});

// Rota para remover um nó Produto específico
app.delete('/produtos/:id', async (req, res) => {
    const id = req.params.id;

    try {
        await session.run('MATCH (n:Produto) WHERE id(n) = $id DELETE n', { id: parseInt(id) });
        res.send('Product deleted');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting product');
    }
});
// Rota para editar um nó Produto específico
app.patch('/produtos/:id', async (req, res) => {
    const id = req.params.id;
    const body = req.body;

    try {
        const set = Object.keys(body)
            .map(key => `n.${key} = $${key}`)
            .join(', ');
        await session.run(`MATCH (n:Produto) WHERE id(n) = $id SET ${set} RETURN n`, {
            id: parseInt(id),
            ...body
        });

        const result = await session.run('MATCH (n:Produto) WHERE id(n) = $id RETURN n', { id: parseInt(id) });
        const singleRecord = result.records[0];
        const node = singleRecord.get(0);

        res.json({
            id: node.identity.toString(),
            ...node.properties
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating product');
    }
});

// Rota para encerrar a sessão e o driver
app.get('/shutdown', async (req, res) => {
    try {
        await session.close();
        await driver.close();
        res.send('Shutdown complete');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error shutting down');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`App listening at http://localhost:${port}`);
});
