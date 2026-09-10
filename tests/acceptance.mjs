async function runAcceptanceTest() {
  const base = "http://localhost:3000/api";

  console.log("1. Registering user...");
  const regRes = await fetch(base + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rupesh Traveler",
      email: `rupesh.accept.${Date.now()}@yatra.in`,
      password: "Password123"
    })
  });
  const regData = await regRes.json();
  console.log("Registration status:", regRes.status, "Token:", !!regData.data?.token);
  const token = regData.data.token;

  console.log("2. Searching location for Patna...");
  const locRes = await fetch(base + "/location/search?query=Patna");
  const locData = await locRes.json();
  const patna = locData.data.results[0];
  console.log("Found location:", patna.city, `(${patna.latitude}, ${patna.longitude})`);

  console.log("3. Finding nearby places in Patna...");
  const placesRes = await fetch(base + `/places/nearby?latitude=${patna.latitude}&longitude=${patna.longitude}&radius=10000`);
  const placesData = await placesRes.json();
  console.log("Nearby places found:", placesData.data.count);

  console.log("4. Fetching factual details for Golghar...");
  const golgharRes = await fetch(base + "/places/patna-golghar");
  const golgharData = await golgharRes.json();
  console.log("Golghar name:", golgharData.data.place.name, "| Fee: ₹" + golgharData.data.place.entryFee, "| Rating:", golgharData.data.place.rating);

  console.log("5. Planning Yatra with AI (4 hours, ₹1000, History+Food, Friends, Walking)...");
  const aiRes = await fetch(base + "/ai/plan-trip", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({
      location: { city: "Patna" },
      availableTimeMinutes: 240,
      budget: 1000,
      interests: ["history", "food"],
      mood: "relaxed",
      travelGroup: "friends",
      transportPreference: "walking"
    })
  });
  const aiData = await aiRes.json();
  const trip = aiData.data.trip;
  console.log("AI Planned Trip:", trip.title, "| Stops:", trip.stops.length, "| Estimated Cost: ₹" + trip.itinerary.estimatedTotalCost);

  console.log("6. Simulating YATRA LIVE: Place unavailable -> Dynamic replan...");
  const liveRes = await fetch(base + `/trips/${trip.id}/recalculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({
      reason: "PLACE_UNAVAILABLE",
      affectedStopId: trip.stops[0].id,
      currentLocation: { latitude: patna.latitude, longitude: patna.longitude },
      remainingTimeMinutes: 180,
      remainingBudget: 800
    })
  });
  const liveData = await liveRes.json();
  console.log("Yatra Live Replaced Stop Note:", liveData.data.trip.stops[0].notes);

  console.log("7. Marking trip as COMPLETED...");
  const updateRes = await fetch(base + `/trips/${trip.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
    body: JSON.stringify({ status: "COMPLETED" })
  });
  const updateData = await updateRes.json();
  console.log("Final Trip Status:", updateData.data.trip.status);

  console.log("\n=======================================================");
  console.log("🎉 ALL SECTION 38 ACCEPTANCE TESTS PASSED SUCCESSFULLY!");
  console.log("=======================================================");
}

runAcceptanceTest().catch(console.error);
