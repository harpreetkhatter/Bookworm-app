import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import styles from "../../assets/styles/create.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/colors";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import { readAsStringAsync } from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";

const Create = () => {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(null); //to display the image in the app
  const [rating, setRating] = useState(3);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { token } = useAuthStore();

  const pickImage = async () => {
    try {
      //request permission if needed
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission denied",
            "Please allow access to your media library.",
          );
          return;
        }
      }

      //launch the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });

      console.log("Image picker result:", result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log("Selected image URI:", asset.uri);

        // Compress and resize the image aggressively
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 600 } }], // Smaller size for base64 transmission
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

        console.log("Manipulated image URI:", manipulatedImage.uri);
        setImage(manipulatedImage.uri);

        // Convert compressed image to base64
        const base64 = await readAsStringAsync(manipulatedImage.uri, {
          encoding: "base64",
        });

        console.log("Base64 length:", base64.length);
        setImageBase64(base64);
        Alert.alert("Success", "Image selected successfully!");
      }
    } catch (error) {
      console.error("pickImage error:", error);
      Alert.alert("Error", `Failed to pick image: ${error.message}`);
    }
  };
  const handleSubmit = async () => {
    if (!title || !caption || !imageBase64 || !rating) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      // Format as JPEG data URI (since we compressed to JPEG)
      const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

      const response = await fetch(`${API_URL}/api/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          caption,
          image: imageDataUrl,
          rating: rating.toString(),
        }),
      });

      const rawText = await response.text();
      let data;

      if (response.status === 413) {
        throw new Error(
          "Image is still too large. Please try a different image.",
        );
      }

      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(
          `Server returned invalid JSON (${response.status}): ${rawText}`,
        );
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit recommendation");
      }

      Alert.alert("Success", "Recommendation submitted successfully");
      setTitle("");
      setCaption("");
      setImage(null);
      setImageBase64(null);
      setRating(3);
      router.push("/");
    } catch (error) {
      console.error("handleSubmit error:", error);
      Alert.alert("Error", error.message || "Failed to submit recommendation");
    } finally {
      setLoading(false);
    }
  }

  const renderRatingPicker = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          style={styles.starButton}
        >
          <Ionicons
            name={i <= rating ? "star" : "star-outline"}
            size={24}
            color={i <= rating ? "#f4b400" : COLORS.textSecondary}
          />
        </TouchableOpacity>,
      );
    }
    return <View style={styles.ratingContainer}>{stars}</View>;
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        style={styles.scrollViewStyle}
      >
        <View style={styles.card}>
          {/* header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Book Recommendations</Text>
            <Text style={styles.subtitle}>
              Share your favorite reads with others
            </Text>
          </View>

          {/* form */}
          <View style={styles.form}>
            {/* Book Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title"
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>
            {/* rating */}
            <View style={styles.formGroup}>{renderRatingPicker()}</View>

            {/* image */}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Image</Text>
              <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.previewImage} />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons
                      name="image-outline"
                      size={40}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.placeholderText}>
                      Tap to select image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* caption */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your review or thoughts about book..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline={true}
              />
            </View>
            {/* button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Create;
