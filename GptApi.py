import os
from dotenv import load_dotenv, find_dotenv
from prompt_utils import get_prompt
import json
import requests
import numpy as np
import pandas as pd
load_dotenv(find_dotenv())
class PlanetAssistant:
    def __init__(self):
        self.api_url_chat = "https://api.openai.com/v1/chat/completions"
        self.api_url_image = "https://api.openai.com/v1/images/generations"
        self.api_key = os.environ['OPENAI_API_KEY']  # Ensure the API key is set in your environment variables
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def send_request(self, data_json):
        """
        Send a request to the OpenAI API with the provided JSON data for chat completions.
        """
        response = requests.post(self.api_url_chat, headers=self.headers, data=data_json)
        return response.json()['choices'][0]['message']['content']

    def parse_planet_description(self, user_input):
        """
        Generate a JSON structure to parse user input about a planet and get a structured response.
        """
        data = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": "You are an assistant that parses user inputs about planets. Based on the input, determine the planet's size, temperature, type, and color. If details are not explicitly provided, make logical inferences."
                },
                {
                    "role": "user",
                    "content": user_input
                }
            ],
            "response_format": {
                "type": "json_schema",
                "json_schema": {
                    "name": "planet_features_response",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "planet_size": {"type": "string", "enum": ["small", "medium", "large"]},
                            "temperature": {"type": "string", "enum": ["cold", "temperate", "hot"]},
                            "type": {"type": "string", "enum": ["rocky", "gassy", "icy"]},
                            "color": {"type": "string"}
                        },
                        "required": ["planet_size", "temperature", "type", "color"],
                        "additionalProperties": False
                    }
                }
            }
        })
        return self.send_request(data)

    def estimate_planet_parameters(self, features, data):
        """
        Estimate comprehensive planetary parameters based on user-defined features and dataset quantiles.
        """
        features = json.loads(features)

        # Constants
        R_star = 1.0  # Assuming solar radii
        T_star = 5780  # Assuming solar temperature in Kelvin
        G = 6.67430e-11  # Gravitational constant in m^3 kg^-1 s^-2
        earth_radius = 6371000  # Earth radius in meters
        au_in_meters = 149.6e9  # One astronomical unit in meters

        # Determine quantile ranges and mass and period ranges
        quantiles = {
            'small': (0.0, 0.25),
            'medium': (0.25, 0.75),
            'large': (0.75, 1.0)
        }

        size = features.get('planet_size', 'medium').lower()
        quantile_range = quantiles[size]
        mass_range = data['pl_bmasse'].quantile(quantile_range)
        period_range = data['pl_orbper'].quantile(quantile_range)

        # Random selection within the quantile range for mass in Earth masses
        planet_mass_earth_masses = np.random.uniform(mass_range.iloc[0], mass_range.iloc[1])
        planet_mass = planet_mass_earth_masses * 5.972e24  # Convert Earth masses to kg

        # Calculate gravity and radius
        planet_radius = earth_radius * (planet_mass / 5.972e24) ** (1 / 3)  # Scale radius based on mass
        gravity = (G * planet_mass) / (planet_radius ** 2)
        gravity_normalized = gravity / 9.807  # Normalize by Earth's gravity

        # Orbital period and distance calculations
        orbital_period_days = np.random.uniform(period_range.iloc[0], period_range.iloc[1])
        orbital_period_years = orbital_period_days / 365.25
        orbital_distance = np.sqrt(G * planet_mass * (orbital_period_years * 365.25 * 24 * 3600) ** 2 / (4 * np.pi ** 2))
        orbital_distance_au = orbital_distance / au_in_meters

        # Calculate stellar luminosity and habitable zone
        L_star = (R_star ** 2) * ((T_star / 5778) ** 4)
        inner_boundary = np.sqrt(L_star / 1.1)
        outer_boundary = np.sqrt(L_star / 0.53)

        # Determine habitability
        habitable = inner_boundary <= orbital_distance_au <= outer_boundary

        # Approximate temperature based on user input or distance from the star
        temperature_estimation = {
            "cold": "< 250K",
            "temperate": "250K - 350K",
            "hot": "> 350K"
        }

        # Round numerical values for more readable output
        return {
            'planet_size': size,
            'planet_type': features.get('type', 'unknown'),
            'planet_color': features.get('color', 'unknown'),
            'approximate_temperature': temperature_estimation.get(features.get('temperature', 'temperate'), 'unknown'),
            'approximate_mass_earth_masses': round(planet_mass_earth_masses, 2),
            'gravity_earth_g': round(gravity_normalized, 2),
            'orbital_period_years': round(orbital_period_years, 2),
            'orbital_distance_au': round(orbital_distance_au, 2),
            'habitable': habitable
        }

    def get_dalle_prompt(self, features):
        """
        Create a DALL-E prompt based on provided features to generate an image for a child interested in exoplanets.
        """
        prompt = f"Given these features {features}, write a DALL-E prompt to generate a picture for a child who is interested in exoplanets."
        data = json.dumps({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": prompt
                }
            ]
        })
        return self.send_request(data)

    def generate_dalle_image(self, prompt, size="1024x1024", n=1):
        """
        Generate an image using DALL-E based on the prompt.
        """
        data = json.dumps({
            "model": "dall-e-3",
            "prompt": prompt,
            "size": size,
            "quality": "standard",
            "n": n
        })
        response = requests.post(self.api_url_image, headers=self.headers, data=data)

        if response.status_code == 200:
            response_data = response.json()
            return response_data['data'][0]['url']
        else:
            print("Failed to generate image:", response.text)
            return None

    def generate_planet_image(self, user_input, data):
        """
        Complete flow:
        1. Get simple features from user input.
        2. Estimate planet parameters.
        3. Generate a DALL-E prompt.
        4. Generate and return DALL-E image.
        """
        # Step 1: Parse simple features
        features = self.parse_planet_description(user_input)

        # Step 2: Estimate additional parameters
        detailed_parameters = self.estimate_planet_parameters(features, data)

        # Step 3: Generate DALL-E prompt
        dalle_prompt = self.get_dalle_prompt(detailed_parameters)

        # Step 4: Generate and return DALL-E image
        image_url = self.generate_dalle_image(dalle_prompt)
        return image_url

# Example Usage


if __name__ == '__main__':
    df = pd.read_csv('Data/merged.csv')
    user_input = "I want a very big planet, it should be cold, even and blue."
    assistant = PlanetAssistant()
    image_url = assistant.generate_planet_image(user_input, df)
    print("Generated Image URL:", image_url)
