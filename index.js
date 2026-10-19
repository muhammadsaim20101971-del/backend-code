const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://muhammadsaim3622_db_user:kENYdkM4cWRN3i1c@clusterlearn.taibsat.mongodb.net/?appName=ClusterLearn";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  await client.connect();
  await client.db("admin").command({ ping: 1 });
  console.log("Connected to MongoDB Atlas");
}

module.exports = { uri, connectDB };

if (require.main === module) {
  connectDB()
    .catch((error) => {
      console.error("MongoDB connection failed:", error);
      process.exitCode = 1;
    })
    .finally(() => client.close());
}