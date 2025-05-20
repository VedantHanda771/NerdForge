import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

// import CourseCard from "../components/Catalog/CourseCard"
// import CourseSlider from "../components/Catalog/CourseSlider"
import Footer from "../components/common/Footer"
import Course_Card from '../components/core/Catalog/Course_Card'
import Course_Slider from "../components/core/Catalog/Course_Slider"
import Loading from './../components/common/Loading';

import { getCatalogPageData } from '../services/operations/pageAndComponentData'
import { fetchCourseCategories } from './../services/operations/courseDetailsAPI';

function Catalog() {
    const { catalogName } = useParams()
    const [active, setActive] = useState(1)
    const [catalogPageData, setCatalogPageData] = useState(null)
    const [categoryId, setCategoryId] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Fetch All Categories
    useEffect(() => {
        ; (async () => {
            try {
                const res = await fetchCourseCategories()
                if (!res || res.length === 0) {
                    setError("No categories found")
                    return
                }
                
                console.log("All Categories:", res);
                console.log("Looking for category matching:", catalogName);
                
                const category = res.find(
                    (ct) => ct.name.split(" ").join("-").toLowerCase() === catalogName
                )
                
                if (!category) {
                    console.log("Category not found. Available categories:", res.map(c => c.name));
                    setError(`Category "${catalogName}" not found`)
                    return
                }
                
                console.log("Selected category details:", category);
                setCategoryId(category._id)
            } catch (error) {
                console.error("Could not fetch Categories:", error)
                setError(error.message || "Failed to fetch categories")
            }
        })()
    }, [catalogName])

    useEffect(() => {
        if (categoryId) {
            ; (async () => {
                setLoading(true)
                setError(null)
                try {
                    console.log("Fetching catalog data for categoryId:", categoryId);
                    const res = await getCatalogPageData(categoryId)
                    console.log("Catalog data response:", res);
                    
                    if (!res) {
                        throw new Error("No data received for the selected category")
                    }
                    setCatalogPageData(res)
                } catch (error) {
                    console.error("Error fetching catalog data:", error)
                    setError(error.message || "Failed to fetch category data")
                }
                setLoading(false)
            })()
        }
    }, [categoryId])

    if (loading) {
        return (
            <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
                <Loading />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-white text-4xl flex justify-center items-center mt-[20%]">
                {error}
            </div>
        )
    }

    if (!loading && !catalogPageData) {
        return (
            <div className="text-white text-4xl flex justify-center items-center mt-[20%]">
                No Courses found for selected Category
            </div>
        )
    }

    return (
        <>
            {/* Hero Section */}
            <div className=" box-content bg-richblack-800 px-4">
                <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent ">
                    <p className="text-sm text-richblack-300">
                        {`Home / Catalog / `}
                        <span className="text-yellow-25">
                            {catalogPageData?.selectedCategory?.name}
                        </span>
                    </p>
                    <p className="text-3xl text-richblack-5">
                        {catalogPageData?.selectedCategory?.name}
                    </p>
                    <p className="max-w-[870px] text-richblack-200">
                        {catalogPageData?.selectedCategory?.description}
                    </p>
                </div>
            </div>

            {/* Section 1 */}
            <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
                <div className="section_heading">Courses to get you started</div>
                <div className="my-4 flex border-b border-b-richblack-600 text-sm">
                    <p
                        className={`px-4 py-2 ${active === 1
                            ? "border-b border-b-yellow-25 text-yellow-25"
                            : "text-richblack-50"
                            } cursor-pointer`}
                        onClick={() => setActive(1)}
                    >
                        Most Populer
                    </p>
                    <p
                        className={`px-4 py-2 ${active === 2
                            ? "border-b border-b-yellow-25 text-yellow-25"
                            : "text-richblack-50"
                            } cursor-pointer`}
                        onClick={() => setActive(2)}
                    >
                        New
                    </p>
                </div>
                <div>
                    <Course_Slider
                        Courses={catalogPageData?.selectedCategory?.courses}
                    />
                </div>
            </div>

            {/* Section 2 */}
            <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
                <div className="section_heading">
                    Top courses in {catalogPageData?.differentCategory?.name}
                </div>
                <div>
                    <Course_Slider
                        Courses={catalogPageData?.differentCategory?.courses}
                    />
                </div>
            </div>

            {/* Section 3 */}
            <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
                <div className="section_heading">Frequently Bought</div>
                <div className="py-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {catalogPageData?.mostSellingCourses
                            ?.slice(0, 4)
                            .map((course, i) => (
                                <Course_Card course={course} key={i} Height={"h-[300px]"} />
                            ))}
                    </div>
                </div>
            </div>

            <Footer />
        </>
    )
}

export default Catalog
