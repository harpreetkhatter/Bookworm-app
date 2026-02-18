import express from "express";
import "dotenv/config";
import authRoutes from "./authRoutes.js";
import Book from "../models/Book.js";
import cloudinary from "../lib/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { title, caption, rating, image } = req.body;

    if (!title || !caption || !rating || !image) {
      return res.status(400).json({ message: "All fields are required" });
    }
    //upload the image with optimization
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "bookworm",
      transformation: [
        { width: 1000, crop: "limit" }, // Limit max width to 1000px
        { quality: "auto:good" }, // Auto quality optimization
        { fetch_format: "auto" } // Auto format selection (WebP when supported)
      ]
    });
    const imageUrl = uploadResponse.secure_url;

    const newBook = new Book({
      title,
      caption,
      rating,
      image: imageUrl,
      user: req.user._id,
    });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    console.log("Error in creating book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//pagination =>infinite loading
router.get("/", protectRoute, async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profileImage");
    const totalBooks = await Book.countDocuments();
    res.status(200).json({
      books,
      currentPage: page,
      totalBooks,
      totalPages: Math.ceil(totalBooks / limit),
    });
  } catch (error) {
    console.log("Error in getting books", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/user", protectRoute, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (error) {
    console.log("Error in getting user books", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/:id", protectRoute, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    //check user is creator of book
    if (book.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    //delete image from cloudinary
    if (!book.image && book.image.includes("cloudinary")) {
      try {
        const publicId = book.image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("Error in deleting image from cloudinary", error);
      }
    }
    await book.deleteOne();
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.log("Error in deleting book", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


export default router;
