const request = require('supertest');
const express = require('express');
const combinedHotelDataController = require('../../controller/combinedHotelDataController');
const fetchMock = require('jest-fetch-mock');

// Enable fetch mocking (this mocks the external HTTP calls, not the services)
fetchMock.enableMocks();

const app = express();
app.use(express.json());
app.post('/combined-hotel-data', combinedHotelDataController.getCombinedHotelData);

describe('Combined Hotel Data Controller + Services Integration Tests', () => {
  
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  const validRequestBody = {
    "destination_id": "RsBU",
    "hotel_id": "jOZC",
    "checkin": "2025-10-01",
    "checkout": "2025-10-07",
    "currency": "SGD",
    "rooms": "2",
    "guestsEachRoom": "2"
  };

  // Mock response for hotel details API
  const mockHotelDetailsApiResponse = {
    id: "jOZC",
    name: "Park Avenue Rochester",
    address: "31 Rochester Drive",
    rating: 4,
    latitude: 1.3049,
    longitude: 103.788184,
    description: "Hotel description...",
    amenities: {
      inHouseBar: true,
      fitnessFacility: true,
      inHouseDining: true,
      dryCleaning: true,
      outdoorPool: true,
      nonSmokingRooms: true,
      continentalBreakfast: true,
      airportTransportation: true
    },
    categories: {},
    amenities_ratings: [],
    image_details: {
      suffix: ".jpg",
      count: 69,
      prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/jOZC/"
    },
    imageCount: 69,
    number_of_images: 69,
    default_image_index: 1,
    hires_image_index: "",
    checkin_time: "3:00 PM"
  };

  // Mock response for hotel rooms API (what the poller eventually gets)
  const mockHotelRoomsApiResponse = {
    completed: true,
    rooms: [
      {
        roomNormalizedDescription: "Superior Double Or Twin Room 1 King Bed",
        free_cancellation: true,
        roomAdditionalInfo: {
          breakfastInfo: "hotel_detail_room_only",
          displayFields: {
            special_check_in_instructions: "Front desk staff will greet guests on arrival at the property.",
            kaligo_service_fee: 685.27,
            hotel_fees: [],
            surcharges: [
              {
                type: "TaxAndServiceFee",
                amount: 733.8
              }
            ]
          }
        },
        long_description: "<p><strong>1 King Bed OR 2 Twin Beds</strong></p><p>204 sq feet </p><br/><p><b>Internet</b> - Free WiFi </p>",
        price: 6721.08,
        images: [
          {
            hero_image: true,
            url: "https://i.travelapi.com/lodging/5000000/4720000/4715700/4715695/68404fde_b.jpg"
          },
          {
            hero_image: false,
            url: "https://i.travelapi.com/lodging/5000000/4720000/4715700/4715695/alt_image.jpg"
          }
        ]
      }
    ]
  };

  describe('1. Successful Integration Flow', () => {
    
    test('should successfully integrate controller with both services', async () => {
      // Mock the external HTTP calls that the services make
      fetchMock.mockResponses(
        // First call: hotelDetailsService calls hotel details API
        [JSON.stringify(mockHotelDetailsApiResponse), { status: 200 }],
        // Second call: hotelRoomsService calls rooms API via poller
        [JSON.stringify(mockHotelRoomsApiResponse), { status: 200 }]
      );

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(200);
      
      // Verify the response structure matches what the services actually return
      expect(response.body).toEqual({
        hotelDetails: {
          id: "jOZC",
          name: "Park Avenue Rochester",
          address: "31 Rochester Drive",
          rating: 4,
          latitude: 1.3049,
          longitude: 103.788184,
          description: "Hotel description...",
          amenities: {
            inHouseBar: true,
            fitnessFacility: true,
            inHouseDining: true,
            dryCleaning: true,
            outdoorPool: true,
            nonSmokingRooms: true,
            continentalBreakfast: true,
            airportTransportation: true
          },
          categories: {},
          amenities_ratings: [],
          image_details: {
            suffix: ".jpg",
            count: 69,
            prefix: "https://d2ey9sqrvkqdfs.cloudfront.net/jOZC/"
          },
          imageCount: 69,
          number_of_images: 69,
          default_image_index: 1,
          hires_image_index: "",
          checkin_time: "3:00 PM"
        },
        rooms: [
          {
            roomNormalizedDescription: "Superior Double Or Twin Room 1 King Bed",
            free_cancellation: true,
            breakfastInfo: "hotel_detail_room_only",
            additionalInfo: {
              breakfastInfo: "hotel_detail_room_only",
              displayFields: {
                special_check_in_instructions: "Front desk staff will greet guests on arrival at the property.",
                kaligo_service_fee: 685.27,
                hotel_fees: [],
                surcharges: [
                  {
                    type: "TaxAndServiceFee",
                    amount: 733.8
                  }
                ]
              }
            },
            longDesc: "<p><strong>1 King Bed OR 2 Twin Beds</strong></p><p>204 sq feet </p><br/><p><b>Internet</b> - Free WiFi </p>",
            price: 6721.08,
            image: "https://i.travelapi.com/lodging/5000000/4720000/4715700/4715695/68404fde_b.jpg"
          }
        ]
      });

      // Verify both external APIs were called with correct URLs
      expect(fetchMock).toHaveBeenCalledTimes(2);
      
      // Verify hotel details API call
      const hotelDetailsCall = fetchMock.mock.calls[0][0];
      expect(hotelDetailsCall).toBe('https://hotelapi.loyalty.dev/api/hotels/jOZC');
      
      // Verify rooms API call (URL construction by hotelRoomsService)
      const roomsCall = fetchMock.mock.calls[1][0];
      expect(roomsCall).toContain('https://hotelapi.loyalty.dev/api/hotels/jOZC/price');
      expect(roomsCall).toContain('destination_id=RsBU');
      expect(roomsCall).toContain('checkin=2025-10-01');
      expect(roomsCall).toContain('checkout=2025-10-07');
      expect(roomsCall).toContain('currency=SGD');
      expect(roomsCall).toContain('guests=2|2'); // 2 rooms with 2 guests each
    });

    test('should handle rooms with no hero image correctly', async () => {
      const mockRoomsWithoutHeroImage = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "Standard Room",
            free_cancellation: false,
            roomAdditionalInfo: {
              breakfastInfo: "breakfast_included"
            },
            long_description: "Standard room description",
            price: 3500.00,
            images: [
              {
                hero_image: false,
                url: "https://example.com/room1.jpg"
              }
            ]
          }
        ]
      };

      fetchMock.mockResponses(
        [JSON.stringify(mockHotelDetailsApiResponse), { status: 200 }],
        [JSON.stringify(mockRoomsWithoutHeroImage), { status: 200 }]
      );

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.body.rooms[0].image).toBeUndefined(); // No hero image found
    });

    test('should handle different guest configurations', async () => {
      const differentGuestConfig = {
        ...validRequestBody,
        rooms: "3",
        guestsEachRoom: "4"
      };

      fetchMock.mockResponses(
        [JSON.stringify(mockHotelDetailsApiResponse), { status: 200 }],
        [JSON.stringify(mockHotelRoomsApiResponse), { status: 200 }]
      );

      await request(app)
        .post('/combined-hotel-data')
        .send(differentGuestConfig);

      // Verify the rooms API was called with correct guest configuration
      const roomsCall = fetchMock.mock.calls[1][0];
      expect(roomsCall).toContain('guests=4|4|4'); // 3 rooms with 4 guests each
    });
  });

  describe('2. Service-Level Error Handling', () => {
    
    test('should handle hotel details API returning 404', async () => {
      fetchMock.mockResponses(
        // Hotel details API returns 404
        ['Not Found', { status: 404, statusText: 'Not Found' }],
        // Rooms API would succeed but won't be reached due to Promise.all
        [JSON.stringify(mockHotelRoomsApiResponse), { status: 200 }]
      );

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Combined hotel data fetch failed");
      expect(response.body.message).toBe("Failed to fetch hotel details: HTTP 404: Not Found");
    });

    test('should handle hotel rooms API returning 503', async () => {
      fetchMock.mockResponses(
        [JSON.stringify(mockHotelDetailsApiResponse), { status: 200 }],
        // Rooms API returns 503
        ['Service Unavailable', { status: 503, statusText: 'Service Unavailable' }]
      );

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Combined hotel data fetch failed");
      expect(response.body.message).toContain("Failed to fetch room details:");
    });

    test('should handle network errors from hotel details service', async () => {
      fetchMock.mockReject(new Error('Network timeout'));

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Failed to fetch hotel details: Network timeout");
    });

    test('should handle invalid JSON from hotel details API', async () => {
      fetchMock.mockResponses([
        'invalid json response',
        { status: 200 }
      ]);

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Failed to fetch hotel details:");
    });
  });

  describe('3. Data Processing Integration', () => {
    test('should handle empty rooms array from rooms API', async () => {
      const emptyRoomsResponse = {
        completed: true,
        rooms: []
      };

      // Provide one valid response followed by repeated valid responses
      fetchMock.mockResponses(
        // hotel details API call
        [JSON.stringify(mockHotelDetailsApiResponse), { status: 200 }],

        // rooms API poller calls: repeat the same response enough times for poller attempts
        ...Array(10).fill([JSON.stringify(emptyRoomsResponse), { status: 200 }])
      );

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.body.rooms).toEqual([]);
    });

    test('should handle rooms with missing optional fields', async () => {
      const minimalRoomResponse = {
        completed: true,
        rooms: [
          {
            roomNormalizedDescription: "Basic Room",
            free_cancellation: true,
            // Missing roomAdditionalInfo, images, etc.
            long_description: "Basic room",
            price: 1000.00
          }
        ]
      };

      fetchMock.mockResponses(
        [JSON.stringify(mockHotelDetailsApiResponse), { status: 200 }],
        [JSON.stringify(minimalRoomResponse), { status: 200 }]
      );

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(validRequestBody);

      expect(response.status).toBe(200);
      expect(response.body.rooms[0]).toEqual({
        roomNormalizedDescription: "Basic Room",
        free_cancellation: true,
        breakfastInfo: undefined,
        additionalInfo: undefined,
        longDesc: "Basic room",
        price: 1000.00
        // No image property since no images array
      });
    });
  });

  describe('4. Request Validation (Integration Level)', () => {
    
    test('should validate required fields before calling services', async () => {
      const invalidRequest = {
        hotel_id: "jOZC"
        // Missing other required fields
      };

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Missing");
      
      // No external API calls should be made
      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('should validate dates before calling services', async () => {
      const invalidDateRequest = {
        ...validRequestBody,
        checkin: "2025-08-04", // Too soon (less than 3 days from Aug 3, 2025)
      };

      const response = await request(app)
        .post('/combined-hotel-data')
        .send(invalidDateRequest);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid checkin date");
      
      // No external API calls should be made
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});