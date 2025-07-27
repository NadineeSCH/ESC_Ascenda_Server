async function getHotelDetails(req) {
  try {
    const hotelId = req.body.hotelId;
    const targetUrl = `https://hotelapi.loyalty.dev/api/hotels/${hotelId}`;
    
    let hotelData;
    try {
      const response = await fetch(targetUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      hotelData = await response.json();
      
    } catch (error) {
      throw new Error(`Failed to fetch from external API: ${error.message}`);
    }

    const cleanedHotelData = {
      id: hotelData.id,
      name: hotelData.name,
      address: hotelData.address,
      rating: hotelData.rating,
      latitude: hotelData.latitude,
      longitude: hotelData.longitude,
      description: hotelData.description,
      amenities: hotelData.amenities,
      categories: hotelData.categories,
      amenities_ratings: hotelData.amenities_ratings,
      image_details: hotelData.image_details,
      imageCount: hotelData.imageCount,
      number_of_images: hotelData.number_of_images,
      default_image_index: hotelData.default_image_index,
      hires_image_index: hotelData.hires_image_index,
      checkin_time: hotelData.checkin_time,
    };

    return { success: true, data: cleanedHotelData };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      details: {
        endpoint: "hotelDetailsService",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

module.exports = {
  getHotelDetails,
};