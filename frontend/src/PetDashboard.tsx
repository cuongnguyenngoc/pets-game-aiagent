import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PetDashboard() {
  const [pets, setPets] = useState([]);
  const [newPetName, setNewPetName] = useState("");
  const [newPetTraits, setNewPetTraits] = useState("");
  const [newPetStats, setNewPetStats] = useState({
    hunger: 50,
    cleanliness: 50,
    energy: 50,
    affection: 50,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:3001/pets")
      .then((response) => {
        console.log("response", response.data);
        setPets(response.data);
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to load pets." });
        setLoading(false);
      });
  }, [setPets]);

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`http://localhost:3001/pets/${id}`);
      setPets((prevPets) => prevPets.filter((pet) => pet._id !== id));
      setMessage({ type: "success", text: "Pet deleted successfully." });
    } catch {
      setMessage({ type: "error", text: "Failed to delete pet." });
    }
    setLoading(false);
  };

  const handleAddPet = () => {
    if (!newPetName || !newPetTraits) return;
    setLoading(true);
    axios
      .post("http://localhost:3001/pets/generate-pet", {
        name: newPetName,
        traits: newPetTraits.split(","),
        stats: newPetStats,
      })
      .then((response) => {
        setPets([...pets, response.data]);
        setNewPetName("");
        setNewPetTraits("");
        setNewPetStats({
          hunger: 50,
          cleanliness: 50,
          energy: 50,
          affection: 50,
        });
        setLoading(false);
        setMessage({ type: "success", text: "Pet added successfully." });
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to add pet." });
        setLoading(false);
      });
  };

  const handleAction = (id, action) => {
    setLoading(true);
    axios
      .post(`http://localhost:3001/pets/${id}/interact`, { action })
      .then((response) => {
        console.log("response", response.data);
        setPets(pets.map((pet) => (pet._id === id ? response.data : pet)));
        setLoading(false);
        setMessage({ type: "success", text: `Pet ${action}ed successfully.` });
      })
      .catch(() => {
        setMessage({ type: "error", text: `Failed to ${action} pet.` });
        setLoading(false);
      });
  };

  const generatePetImage = (id, name) => {
    setLoading(true);
    axios
      .post(`http://localhost:3001/pets/${id}/generate-image`, { name })
      .then((response) => {
        setPets(
          pets.map((pet) =>
            pet._id === id ? { ...pet, imageUrl: response.data.imageUrl } : pet
          )
        );
        setLoading(false);
        setMessage({
          type: "success",
          text: "AI image generated successfully.",
        });
      })
      .catch(() => {
        setMessage({ type: "error", text: "Failed to generate AI image." });
        setLoading(false);
      });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex gap-2">
        <Input
          value={newPetName}
          onChange={(e) => setNewPetName(e.target.value)}
          placeholder="Enter new pet name"
        />
        <Input
          value={newPetTraits}
          onChange={(e) => setNewPetTraits(e.target.value)}
          placeholder="Enter pet traits (comma-separated)"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Hunger"
            value={newPetStats.hunger}
            onChange={(e) =>
              setNewPetStats({ ...newPetStats, hunger: +e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Cleanliness"
            value={newPetStats.cleanliness}
            onChange={(e) =>
              setNewPetStats({ ...newPetStats, cleanliness: +e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Energy"
            value={newPetStats.energy}
            onChange={(e) =>
              setNewPetStats({ ...newPetStats, energy: +e.target.value })
            }
          />
          <Input
            type="number"
            placeholder="Affection"
            value={newPetStats.affection}
            onChange={(e) =>
              setNewPetStats({ ...newPetStats, affection: +e.target.value })
            }
          />
        </div>
        <Button onClick={handleAddPet} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Add Pet"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <Card key={pet._id} className="shadow-lg rounded-xl">
            <CardHeader className="text-xl font-bold">{pet.name}</CardHeader>
            <CardContent>
              <img
                src={pet.imageUrl || "https://via.placeholder.com/150"}
                alt={pet.name}
                className="w-full h-40 object-cover rounded-md"
              />
              <p className="mt-2">Personality: {pet.personality}</p>
              <p>Behavior: {pet.behavior}</p>
              <p>Quirks: {pet.quirks}</p>
              <p>Hunger: {pet.stats?.hunger}</p>
              <p>Cleanliness: {pet.stats?.cleanliness}</p>
              <p>Energy: {pet.stats?.energy}</p>
              <p>Affection: {pet.stats?.affection}</p>

              <p>Response: {pet.response}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(pet._id)}
                >
                  Delete
                </Button>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => handleAction(pet._id, "feed")}>
                  Feed
                </Button>
                <Button onClick={() => handleAction(pet._id, "play")}>
                  Play
                </Button>
                <Button onClick={() => handleAction(pet._id, "scold")}>
                  Scold
                </Button>
                <Button onClick={() => handleAction(pet._id, "cuddle")}>
                  Cuddle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {message && (
        <div
          className={`mb-4 flex items-center p-2 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="mr-2" />
          ) : (
            <XCircle className="mr-2" />
          )}
          {message.text}
        </div>
      )}
    </div>
  );
}
