import { Pinecone } from "@pinecone-database/pinecone";
import { v4 as uuidv4 } from "uuid";
const pinecone = new Pinecone({
  apiKey:
    process.env.PINECONE_API ??
    (() => {
      throw new Error("PINECONE_API environment variable is not set");
    })(),
});