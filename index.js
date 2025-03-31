import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

const app = express();
const port = 4000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

async function getPosts() {
  const result = await db.query("SELECT * FROM blog_posts");
  return result.rows;
}
const posts = await getPosts();
//GET All posts
app.get("/posts", async (req, res) => {
  res.json(posts);
});
//GET a specific post by id
app.get("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const selectedPost = posts.find((post) => post.id === id);
  res.json(selectedPost);
});
//POST a new post
app.post("/posts", async (req, res) => {
  const newPost = {
    id: posts.length + 1,
    title: req.body.title,
    content: req.body.content,
    author: req.body.author,
    date: new Date(),
  };
  posts.push(newPost);
  await db.query(
    "INSERT INTO blog_posts (title, content, author) VALUES ($1, $2, $3);",
    [newPost.title, newPost.content, newPost.author]
  );
  res.json(newPost);
});
// PATCH a post when you just want to update one parameter
app.patch("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const currentPost = posts.find((post) => post.id === id);
  const updatedPost = {
    id: id,
    title: req.body.title || currentPost.title,
    content: req.body.content || currentPost.content,
    author: req.body.author || currentPost.author,
    date: new Date(),
  };
  const searchIndex = posts.findIndex((post) => post.id === id);
  posts[searchIndex] = updatedPost;
  await db.query(
    `UPDATE blog_posts SET title = $1, content = $2, author = $3 WHERE id = $4 RETURNING *`,
    [updatedPost.title, updatedPost.content, updatedPost.author, id]
  );
  res.json(updatedPost);
});
//CHALLENGE 5: DELETE a specific post by providing the post id.
app.delete("/posts/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const searchIndex = posts.findIndex((post) => post.id === id);
  if (searchIndex > -1) {
    posts.splice(searchIndex, 1);
    await db.query("DELETE FROM blog_posts WHERE id = $1", [id]);
    res.sendStatus(200);
  } else {
    res
      .status(404)
      .json({ error: `post with id: ${id} not found. No posts were deleted.` });
  }
});
app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});
