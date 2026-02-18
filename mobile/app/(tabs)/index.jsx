import { View, Text, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { API_URL } from "../../constants/api";
import styles from "../../assets/styles/home.styles";
import { Image } from "expo-image";
const Home = () => {
  const { token } = useAuthStore();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBooks = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum == 1) setLoading(true);
      const response = await fetch(`${API_URL}/api/books?page=${pageNum}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("Fetched books data:", data);
      if (!response.ok) throw new Error(data.message || "Failed to fetch books");
      setBooks((prevBooks) => [...prevBooks, ...data.books]);
      setHasMore(pageNum < data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("fetchBooks error:", error);
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);
  const handleLoadMore = async () => { };
  const renderItem = ({ item }) => {
    return (
      <View style={styles.bookCard}>
        <View style={styles.bookHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: item.user.profileImage }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{item.user.username}</Text>
          </View>
        </View>

        <View style={styles.bookImageContainer}>
          <Image
            source={item.image}
            style={styles.bookImage}
            contentFit="cover"
          />
        </View>
      </View>
    );
  };

  return (
    <View styles={styles.container}>
      <FlatList
        data={books}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      ></FlatList>
    </View>
  );
};

export default Home;
