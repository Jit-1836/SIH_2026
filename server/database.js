const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'db.json');

// Helper to generate simulated 128-dimensional normalized face embedding
function generateMockEmbedding(seedStr) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const vec = [];
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    const val = Math.sin(hash + i * 0.1) * 0.5 + 0.5;
    vec.push(val);
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map(v => Number((v / norm).toFixed(4)));
}

const INITIAL_DATA = {
  sos_alerts: [
    {
      id: "SOS-101",
      victim_name: "Rahul Sharma",
      phone: "+91 98765 43210",
      lat: 20.2961,
      lng: 85.8245,
      location_name: "Sector 4, Near Metro Pillar 42",
      category: "Trapped/Structural Collapse",
      urgency: "Critical",
      victim_count: 3,
      details: "Voice SOS triggered: Victim screamed 'HELP HELP' while phone locked. Trapped under collapsed concrete beam after flash flood.",
      trigger_type: "Voice_SOS_LockedPhone",
      status: "Pending",
      dispatch_team: null,
      timestamp: new Date(Date.now() - 10 * 60000).toISOString()
    },
    {
      id: "SOS-102",
      victim_name: "Priya Das",
      phone: "+91 91234 56789",
      lat: 20.2995,
      lng: 85.8210,
      location_name: "River Ghat Road, House #14",
      category: "Water Rising",
      urgency: "Critical",
      victim_count: 5,
      details: "Water reached 1st floor balcony. Need NDRF boat evacuation immediately. 1 infant present.",
      trigger_type: "Manual",
      status: "Dispatched",
      dispatch_team: "NDRF Boat Unit 2",
      timestamp: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: "SOS-103",
      victim_name: "Amitabh Swain",
      phone: "+91 94370 11223",
      lat: 20.2910,
      lng: 85.8350,
      location_name: "Block B, Janpath Enclave",
      category: "Medical",
      urgency: "High",
      victim_count: 2,
      details: "Elderly diabetic patient requires urgent insulin and oxygen cylinder replacement.",
      trigger_type: "Manual",
      status: "Pending",
      dispatch_team: null,
      timestamp: new Date(Date.now() - 40 * 60000).toISOString()
    },
    {
      id: "SOS-104",
      victim_name: "Sunita Mohanty",
      phone: "+91 99381 99887",
      lat: 20.2880,
      lng: 85.8180,
      location_name: "Community Center Ground",
      category: "Food/Water",
      urgency: "Moderate",
      victim_count: 14,
      details: "Drinking water completely depleted. Requesting 50 water bottles and emergency dry ration packets.",
      trigger_type: "Manual",
      status: "Resolved",
      dispatch_team: "Civil Defense Squad 4",
      timestamp: new Date(Date.now() - 90 * 60000).toISOString()
    },
    {
      id: "SOS-105",
      victim_name: "Vikramaditya Roy",
      phone: "+91 98300 44556",
      lat: 20.3040,
      lng: 85.8290,
      location_name: "Acharya Vihar Bridge, West End",
      category: "Trapped/Structural Collapse",
      urgency: "Critical",
      victim_count: 4,
      details: "Voice distress detection triggered background alert. Vehicle submerged under overpass wall collapse.",
      trigger_type: "Voice_SOS_LockedPhone",
      status: "Dispatched",
      dispatch_team: "NDRF Team Alpha",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: "SOS-106",
      victim_name: "Meenakshi Pattnaik",
      phone: "+91 97760 33441",
      lat: 20.2780,
      lng: 85.8420,
      location_name: "Old Town Canal Colony",
      category: "Water Rising",
      urgency: "High",
      victim_count: 8,
      details: "Current fast rising near embankment breach. 3 elderly citizens unable to wade through 4ft water.",
      trigger_type: "Manual",
      status: "Pending",
      dispatch_team: null,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: "SOS-107",
      victim_name: "Deepak Pradhan",
      phone: "+91 94371 88220",
      lat: 20.3120,
      lng: 85.8150,
      location_name: "Patia Station Road, Market Complex",
      category: "Medical",
      urgency: "High",
      victim_count: 1,
      details: "Fractured leg due to roof tile impact. Bleeding controlled, requires stretcher transport.",
      trigger_type: "Manual",
      status: "Pending",
      dispatch_team: null,
      timestamp: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: "SOS-108",
      victim_name: "Kabita Behera",
      phone: "+91 91780 66778",
      lat: 20.2690,
      lng: 85.8310,
      location_name: "Samantarapur Primary School",
      category: "Food/Water",
      urgency: "Moderate",
      victim_count: 22,
      details: "22 school children sheltered in 2nd floor classroom. Running low on food supplies and infant milk powder.",
      trigger_type: "Manual",
      status: "Pending",
      dispatch_team: null,
      timestamp: new Date(Date.now() - 50 * 60000).toISOString()
    }
  ],

  relief_camps: [
    {
      id: "CAMP-101",
      name: "Kalinga Stadium Relief Center",
      location: "Gate 3, Kalinga Complex, BBSR",
      lat: 20.2875,
      lng: 85.8280,
      capacity: 800,
      current_occupancy: 645,
      food_stock_pkts: 1950,
      water_stock_liters: 3400,
      first_aid_kits: 160,
      blankets: 500,
      contact_person: "Capt. R. K. Patnaik (+91 94370 00111)",
      status: "Operational"
    },
    {
      id: "CAMP-102",
      name: "DAV Public School Shelter",
      location: "Unit 8, Main Campus",
      lat: 20.2940,
      lng: 85.8190,
      capacity: 350,
      current_occupancy: 342,
      food_stock_pkts: 190, // Low stock alert trigger (< 1 pkt per head per day)
      water_stock_liters: 280, // Low stock alert trigger
      first_aid_kits: 18,
      blankets: 65,
      contact_person: "Dr. S. N. Sahoo (+91 98610 22334)",
      status: "Warning"
    },
    {
      id: "CAMP-103",
      name: "Utkal University Indoor Gym",
      location: "Vani Vihar Campus",
      lat: 20.3010,
      lng: 85.8410,
      capacity: 500,
      current_occupancy: 230,
      food_stock_pkts: 1350,
      water_stock_liters: 2400,
      first_aid_kits: 110,
      blankets: 360,
      contact_person: "Prof. M. B. Ray (+91 94382 55443)",
      status: "Operational"
    },
    {
      id: "CAMP-104",
      name: "Bhubaneswar Railway Colony Hall",
      location: "Master Canteen Area",
      lat: 20.2660,
      lng: 85.8390,
      capacity: 600,
      current_occupancy: 588,
      food_stock_pkts: 210, // Low stock alert trigger
      water_stock_liters: 390, // Low stock alert trigger
      first_aid_kits: 28,
      blankets: 120,
      contact_person: "Officer J. K. Jena (+91 97771 88990)",
      status: "Warning"
    },
    {
      id: "CAMP-105",
      name: "Capital High School Relief Complex",
      location: "Unit 3, Near Secretariat",
      lat: 20.2750,
      lng: 85.8230,
      capacity: 450,
      current_occupancy: 310,
      food_stock_pkts: 1100,
      water_stock_liters: 1900,
      first_aid_kits: 85,
      blankets: 290,
      contact_person: "Mrs. Arati Mohanty (+91 94372 99112)",
      status: "Operational"
    }
  ],

  camp_victims: [
    {
      id: "VIC-901",
      camp_id: "CAMP-101",
      name: "Aarav Mishra",
      age: 28,
      gender: "Male",
      family_head: "Rajesh Mishra",
      origin: "Nayapalli Sector 3",
      medical_needs: "Minor cuts, tetanus shot done",
      ration_token: "RATION-C101-901",
      registered_at: new Date(Date.now() - 360 * 60000).toISOString(),
      photo_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80",
      face_descriptor: generateMockEmbedding("Aarav Mishra")
    },
    {
      id: "VIC-902",
      camp_id: "CAMP-101",
      name: "Sneha Mishra",
      age: 26,
      gender: "Female",
      family_head: "Rajesh Mishra",
      origin: "Nayapalli Sector 3",
      medical_needs: "None",
      ration_token: "RATION-C101-902",
      registered_at: new Date(Date.now() - 350 * 60000).toISOString(),
      photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80",
      face_descriptor: generateMockEmbedding("Sneha Mishra")
    },
    {
      id: "VIC-903",
      camp_id: "CAMP-102",
      name: "Ramesh Jena",
      age: 54,
      gender: "Male",
      family_head: "Ramesh Jena",
      origin: "Old Town, River Colony",
      medical_needs: "High BP medicine needed",
      ration_token: "RATION-C102-903",
      registered_at: new Date(Date.now() - 180 * 60000).toISOString(),
      photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
      face_descriptor: generateMockEmbedding("Ramesh Jena")
    },
    {
      id: "VIC-904",
      camp_id: "CAMP-103",
      name: "Ananya Behera",
      age: 19,
      gender: "Female",
      family_head: "Bikash Behera",
      origin: "Acharya Vihar",
      medical_needs: "Dehydration - IV fluids given",
      ration_token: "RATION-C103-904",
      registered_at: new Date(Date.now() - 90 * 60000).toISOString(),
      photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
      face_descriptor: generateMockEmbedding("Ananya Behera")
    },
    {
      id: "VIC-905",
      camp_id: "CAMP-104",
      name: "Sanjay Kumar Swain",
      age: 42,
      gender: "Male",
      family_head: "Sanjay Kumar Swain",
      origin: "Master Canteen Ward 4",
      medical_needs: "Asthma inhaler prescribed",
      ration_token: "RATION-C104-905",
      registered_at: new Date(Date.now() - 120 * 60000).toISOString(),
      photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
      face_descriptor: generateMockEmbedding("Sanjay Kumar Swain")
    },
    {
      id: "VIC-906",
      camp_id: "CAMP-105",
      name: "Pooja Mohapatra",
      age: 31,
      gender: "Female",
      family_head: "Manish Mohapatra",
      origin: "Unit 3 Housing Board",
      medical_needs: "Prenatal checkup completed",
      ration_token: "RATION-C105-906",
      registered_at: new Date(Date.now() - 45 * 60000).toISOString(),
      photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      face_descriptor: generateMockEmbedding("Pooja Mohapatra")
    }
  ]
};

class LocalDatabase {
  constructor() {
    this.data = INITIAL_DATA;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        this.data = JSON.parse(raw);
        console.log("Loaded existing local database state from db.json");
      } else {
        this.save();
        console.log("Initialized new local database state in db.json");
      }
    } catch (err) {
      console.error("Error reading db.json, using in-memory defaults:", err);
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error("Error writing db.json:", err);
    }
  }

  // SOS Methods
  getSOSAlerts() {
    return this.data.sos_alerts;
  }

  addSOSAlert(sosData) {
    const isVoice = sosData.trigger_type && sosData.trigger_type.includes('Voice');
    const newAlert = {
      id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
      victim_name: sosData.victim_name || (isVoice ? "Locked Phone Voice SOS Victim" : "Anonymous / Unidentified"),
      phone: sosData.phone || "N/A",
      lat: Number(sosData.lat) || 20.2961,
      lng: Number(sosData.lng) || 85.8245,
      location_name: sosData.location_name || "GPS Coordinate Signal",
      category: sosData.category || (isVoice ? "Voice SOS Locked Phone" : "Medical"),
      urgency: sosData.urgency || (isVoice ? "Critical" : "High"),
      victim_count: Number(sosData.victim_count) || 1,
      details: sosData.details || (isVoice ? "Voice SOS triggered: Scream/Help detected while phone was locked." : "Emergency distress call submitted."),
      trigger_type: sosData.trigger_type || "Manual",
      status: "Pending",
      dispatch_team: null,
      timestamp: new Date().toISOString()
    };
    this.data.sos_alerts.unshift(newAlert);
    this.save();
    return newAlert;
  }

  updateSOSStatus(id, status, dispatch_team = null) {
    const alert = this.data.sos_alerts.find(a => a.id === id);
    if (alert) {
      alert.status = status;
      if (dispatch_team !== null) alert.dispatch_team = dispatch_team;
      this.save();
    }
    return alert;
  }

  // Camp Methods
  getCamps() {
    return this.data.relief_camps;
  }

  updateCampStock(camp_id, stockUpdates) {
    const camp = this.data.relief_camps.find(c => c.id === camp_id);
    if (camp) {
      Object.assign(camp, stockUpdates);
      const foodPerHead = camp.food_stock_pkts / (camp.current_occupancy || 1);
      const waterPerHead = camp.water_stock_liters / (camp.current_occupancy || 1);
      if (foodPerHead < 1.0 || waterPerHead < 1.5) {
        camp.status = "Warning";
      } else {
        camp.status = "Operational";
      }
      this.save();
    }
    return camp;
  }

  // Victim Methods
  getVictims() {
    return this.data.camp_victims;
  }

  registerVictim(victimData) {
    const camp = this.data.relief_camps.find(c => c.id === victimData.camp_id);
    if (camp) {
      camp.current_occupancy = (camp.current_occupancy || 0) + 1;
    }

    const name = victimData.name || "Victim";
    const embedding = victimData.face_descriptor && Array.isArray(victimData.face_descriptor) && victimData.face_descriptor.length === 128
      ? victimData.face_descriptor
      : generateMockEmbedding(name + Date.now());

    // Use uploaded photo or fallback avatar
    const photoUrl = victimData.photo_url || victimData.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80";

    const newVictim = {
      id: `VIC-${Math.floor(900 + Math.random() * 90)}`,
      camp_id: victimData.camp_id || "CAMP-101",
      name: name,
      age: Number(victimData.age) || 30,
      gender: victimData.gender || "Other",
      family_head: victimData.family_head || name,
      origin: victimData.origin || "Local Ward",
      medical_needs: victimData.medical_needs || "None specified",
      ration_token: `RATION-${(victimData.camp_id || "C101").replace('-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      registered_at: new Date().toISOString(),
      photo_url: photoUrl,
      face_descriptor: embedding
    };

    this.data.camp_victims.unshift(newVictim);
    this.save();
    return newVictim;
  }

  // Facial Recognition Match Engine
  matchFace(targetDescriptor) {
    if (!targetDescriptor || !Array.isArray(targetDescriptor)) {
      targetDescriptor = generateMockEmbedding("Aarav Mishra");
    }

    const results = this.data.camp_victims.map(vic => {
      let dist = 0;
      const desc = vic.face_descriptor || generateMockEmbedding(vic.name);
      for (let i = 0; i < Math.min(targetDescriptor.length, desc.length); i++) {
        const diff = targetDescriptor[i] - desc[i];
        dist += diff * diff;
      }
      dist = Math.sqrt(dist);
      const similarity = Math.max(0, Math.min(100, Math.round((1 - (dist / 1.414)) * 100)));
      const camp = this.data.relief_camps.find(c => c.id === vic.camp_id);

      return {
        victim: vic,
        camp_name: camp ? camp.name : "Unknown Shelter",
        camp_location: camp ? camp.location : "N/A",
        similarity_score: similarity,
        distance: Number(dist.toFixed(4))
      };
    });

    results.sort((a, b) => b.similarity_score - a.similarity_score);
    return results;
  }
}

module.exports = new LocalDatabase();
