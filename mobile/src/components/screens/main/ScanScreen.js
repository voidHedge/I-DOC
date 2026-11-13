import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { FlatList, Image, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Modal,
  Button as PaperButton,
  Surface,
  Text,
} from "react-native-paper";

import { config } from "../../../../config";
import Background from "../../backgrounds/AuthorizationBack";
import Button from "../../buttons/button_001";
import Header from "../../texts/Header";
import ParagraphBold from "../../texts/ParagraphBold";
import SmallText from "../../texts/SmallText";
import { theme } from "../../themes/mainTheme";

export default function ScanScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [warning, setWarning] = useState(false);
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugText, setDebugText] = useState("");

  // Стейт для 10 полей
  const [documentData, setDocumentData] = useState({
    surname: "-",
    name: "-",
    patronymic: "-",
    birthday: "-",
    gender: "-",
    serial: "-",
    number: "-",
    issue_date: "-",
    department_code: "-",
    nationality: "-",
  });

  const containerStyle = {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
    width: "90%",
    alignSelf: "center",
  };
  const debugContainerStyle = {
    ...containerStyle,
    maxHeight: "90%",
    width: "95%",
  };

  const takeImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImages([result.assets[0].uri]);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImages([result.assets[0].uri]);
  };

  const deleteImage = () => setImages([]);

  const processImage = async (uri) => {
    setLoading(true);
    setDebugText("Отправка на сервер и распознавание...");

    // Сброс данных перед новым сканированием
    setDocumentData({
      surname: "-",
      name: "-",
      patronymic: "-",
      birthday: "-",
      gender: "-",
      serial: "-",
      number: "-",
      issue_date: "-",
      department_code: "-",
      nationality: "-",
    });

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Вы не авторизованы.");

      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        name: "passport.jpg",
        type: "image/jpeg",
      });

      // Отправляем запрос, указывая тип документа
      const response = await axios.post(`${config.backendUrl}/scan`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        params: {
          document_type: "ru_internal", // Передаем тип как query-параметр
        },
        timeout: 30000,
      });

      const result = response.data;
      setDebugText(JSON.stringify(result, null, 2));

      // Если сервер вернул успешный статус и данные
      if (result.status === "success" && result.parsed_data) {
        setDocumentData(result.parsed_data);
        setVisible(true);
      } else {
        throw new Error(result.message || "Не удалось распознать паспорт.");
      }
    } catch (error) {
      console.error("Ошибка сканирования:", error);

      let errorMsg =
        error.response?.data?.detail || error.message || "Неизвестная ошибка";
      if (error.code === "ECONNABORTED") {
        errorMsg = "Сервер не ответил вовремя.";
      }

      setDebugText(errorMsg);
      setWarning(true);
    } finally {
      setLoading(false);
      setImages([]);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.container}>
      <Image style={styles.image} source={{ uri: item }} />
      <View style={{ gap: 10 }}>
        <View style={styles.element}>
          <Ionicons.Button
            name="cloud-upload"
            backgroundColor={theme.colors.primary}
            onPress={() => processImage(item)}
          >
            Отправить на сервер
          </Ionicons.Button>
          <Ionicons.Button
            name="trash"
            backgroundColor="white"
            color={theme.colors.primary}
            onPress={deleteImage}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Background>
        <Surface
          style={[styles.surface, { backgroundColor: theme.colors.surface }]}
        >
          <Header>Сканирование документов</Header>
          <SmallText>
            Загрузите фото паспорта РФ. Сервер распознает MRZ.
          </SmallText>

          <View style={styles.element}>
            <Image
              style={styles.image2}
              source={{ uri: images[images.length - 1] }}
            />
            <View style={styles.element3}>
              <Ionicons.Button
                name="folder-open"
                backgroundColor={theme.colors.primary}
                onPress={pickImage}
              >
                Загрузить
              </Ionicons.Button>
              <Ionicons.Button
                name="camera"
                backgroundColor={theme.colors.primary}
                onPress={takeImage}
              >
                Сделать фото
              </Ionicons.Button>
            </View>
          </View>

          <FlatList
            style={{ padding: 0 }}
            data={images}
            renderItem={renderItem}
            keyExtractor={(item) => item}
          />
        </Surface>
      </Background>

      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <ActivityIndicator color="#fff" animating size="large" />
          <Text
            style={{
              color: "#fff",
              marginTop: 15,
              fontSize: 16,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            {debugText}
          </Text>
        </View>
      )}

      {/* МОДАЛКА С 10 ПОЛЯМИ */}
      {visible && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={containerStyle}
          >
            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View
                style={{
                  padding: 10,
                  backgroundColor: "#e8f5e9",
                  borderRadius: 5,
                  marginBottom: 15,
                }}
              >
                <SmallText style={{ color: "green", fontWeight: "bold" }}>
                  Данные успешно распознаны!
                </SmallText>
              </View>
              <Header>Данные паспорта</Header>

              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Фамилия:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.surname}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Имя:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.name}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Отчество:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.patronymic}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Дата рождения:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.birthday}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Пол:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.gender}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Серия:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.serial}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Номер:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.number}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Дата выдачи:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.issue_date}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Код подразделения:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.department_code}</ParagraphBold>
                </View>
              </View>
              <View style={styles.element2}>
                <View style={styles.container2}>
                  <SmallText>Гражданство:</SmallText>
                </View>
                <View style={styles.container2}>
                  <ParagraphBold>{documentData.nationality}</ParagraphBold>
                </View>
              </View>

              <PaperButton
                mode="outlined"
                onPress={() => {
                  setVisible(false);
                  setDebugVisible(true);
                }}
                style={{ marginTop: 15 }}
              >
                Показать сырой JSON
              </PaperButton>
              <Button
                mode="contained"
                onPress={() => setVisible(false)}
                style={{ marginTop: 10 }}
              >
                Закрыть
              </Button>
            </ScrollView>
          </Modal>
        </View>
      )}

      {/* Модалка ошибки */}
      {warning && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.4)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Modal
            visible={warning}
            onDismiss={() => setWarning(false)}
            contentContainerStyle={containerStyle}
          >
            <Header>Неудача</Header>
            <View style={styles.element}>
              <MaterialIcons name="error" size={64} color="red" />
            </View>
            <Text style={{ textAlign: "center", marginBottom: 15 }}>
              {debugText}
            </Text>
            <Button
              mode="contained"
              onPress={() => setWarning(false)}
              style={{ marginTop: 10 }}
            >
              Попробовать снова
            </Button>
          </Modal>
        </View>
      )}

      {/* Модалка с JSON */}
      {debugVisible && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.6)",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Modal
            visible={debugVisible}
            onDismiss={() => setDebugVisible(false)}
            contentContainerStyle={debugContainerStyle}
          >
            <ScrollView showsVerticalScrollIndicator={true}>
              <Header>Ответ сервера (JSON)</Header>
              <View
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: 10,
                  borderRadius: 5,
                  marginVertical: 5,
                }}
              >
                <Text style={{ fontSize: 12 }}>{debugText}</Text>
              </View>
              <Button
                mode="contained"
                onPress={() => setDebugVisible(false)}
                style={{ marginTop: 15 }}
              >
                Закрыть
              </Button>
            </ScrollView>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  container2: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginBottom: 5,
    alignSelf: "center",
  },
  image: {
    backgroundColor: theme.colors.secondary,
    alignSelf: "center",
    width: 250,
    height: 250,
    resizeMode: "center",
    marginVertical: 20,
  },
  image2: {
    backgroundColor: theme.colors.secondary,
    alignSelf: "center",
    width: 80,
    height: 80,
    resizeMode: "center",
    marginVertical: 5,
  },
  element: {
    flexDirection: "row",
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  element2: {
    flexDirection: "row",
    margin: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  element3: {
    flexDirection: "column",
    margin: 1,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 5,
  },
  surface: {
    borderRadius: 25,
    width: "100%",
    margin: 25,
    padding: 25,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
