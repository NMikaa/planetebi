import os
from dotenv import load_dotenv, find_dotenv
import json
import requests
import numpy as np
import pandas as pd
load_dotenv(find_dotenv())
import os
import requests
import json
import numpy as np
import pandas as pd

class PlanetAssistant:
    def __init__(self):
        self.api_url_chat = "https://api.openai.com/v1/chat/completions"
        self.api_url_image = "https://api.openai.com/v1/images/generations"
        self.api_key = os.environ['OPENAI_API_KEY']  # Ensure the API key is set in your environment variables
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        self.conversation_state = {}  # To store conversation context and features

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

    def get_dalle_prompt(self):
        """
        Generate a DALL-E prompt based on the stored conversation state features.
        """
        base_features = self.conversation_state['features']
        additional_features = base_features.get('additional_features', [])

        # Start with the main planet description
        prompt = f"Generate an image of a {base_features['planet_size']} {base_features['planet_type']} planet, which is {base_features['planet_color']} and has a temperature of {base_features['approximate_temperature']}."

        # Add additional features if present
        if additional_features:
            prompt += " It also includes " + ", ".join(additional_features) + "."

        # Return the full prompt
        return prompt

    def add_to_prompt(self, addition):
        """
        Add new elements to the existing DALL-E prompt, such as a moon or rings,
        and store the updated prompt in the conversation state.
        """
        # Check if we already have a 'planet_description' field; if not, create it
        if 'additional_features' not in self.conversation_state['features']:
            self.conversation_state['features']['additional_features'] = []

        # Append the new addition to the 'additional_features' list
        self.conversation_state['features']['additional_features'].append(addition)

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

    def start_conversation(self, user_input, data):
        """
        Start the conversation with the user by parsing initial features and generating a DALL-E prompt.
        """
        # Step 1: Parse simple features
        features = self.parse_planet_description(user_input)

        # Step 2: Estimate additional parameters
        detailed_parameters = self.estimate_planet_parameters(features, data)

        # Store the conversation state for future additions
        self.conversation_state = {
            'features': detailed_parameters
        }

    def continue_conversation(self, addition):
        """
        Continue the conversation by allowing the user to add elements to the DALL-E prompt.
        """
        self.add_to_prompt(addition)

    def finalize_conversation(self):
        """
        Finalize the conversation by generating the DALL-E image with the final prompt.
        """
        # Step 3: Generate the final DALL-E prompt
        dalle_prompt = self.get_dalle_prompt()

        # Step 4: Generate and return the DALL-E image
        image_url = self.generate_dalle_image(dalle_prompt)
        return image_url


# Example Usage


if __name__ == '__main__':
    df = pd.read_csv('Data/merged.csv')
    user_input = "I want a very big planet, it should be uneven and red."

    assistant = PlanetAssistant()

    # Start the conversation
    assistant.start_conversation(user_input, df)


    print(assistant.finalize_conversation())

    # User wants to add a moon
    assistant.continue_conversation("a moon orbiting the planet")


    print(assistant.finalize_conversation())
    # User wants to add rings
    assistant.continue_conversation("rings around the planet")

    print(assistant.finalize_conversation())

